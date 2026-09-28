import { BankAccount, PhoneNumber, Profile } from '../types';

/**
 * Strips all non-digit characters (+, -, spaces, brackets)
 * for WhatsApp direct link generation: https://wa.me/<PhoneNumberCleaned>
 */
export function cleanPhoneNumberForWhatsapp(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  // If starts with 00 (international format), replace leading 00 with nothing
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  // If local Yemeni 9-digit mobile starting with 7 (e.g. 770960110), add Yemen country code 967
  if (cleaned.length === 9 && cleaned.startsWith('7')) {
    cleaned = '967' + cleaned;
  }
  return cleaned;
}

/**
 * Builds the direct WhatsApp link: https://wa.me/<PhoneNumberCleaned>
 */
export function buildWhatsappLink(phone: string): string | null {
  const cleaned = cleanPhoneNumberForWhatsapp(phone);
  if (!cleaned) return null;
  return `https://wa.me/${cleaned}`;
}

/**
 * Builds the permanent, unique live link for a card scoped by userId & cardId
 */
export function buildPermanentCardUrl(userId: string, cardId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/?u=${encodeURIComponent(userId)}&c=${encodeURIComponent(cardId)}`;
}

/**
 * Generates a clean URL slug or unique card identifier
 */
export function generateCardId(fullName: string, companyName?: string): string {
  const base = `${fullName || 'card'}-${companyName || ''}`.trim();
  const slug = base
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // Keep letters in all languages (including Arabic) and digits
    .trim()
    .replace(/\s+/g, '-');
  
  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  return (slug.slice(0, 40) || 'card') + `-${randSuffix}`;
}

/**
 * Generates a strictly compliant vCard 3.0 (VERSION:3.0) string
 * ensuring UTF-8 multi-language encoding rules apply (Arabic & English).
 */
export function generateVCardString(
  profile: Profile,
  phoneNumbers: PhoneNumber[],
  bankAccounts: BankAccount[],
  liveCardUrl?: string
): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
  ];

  const fullName = profile.fullName ? profile.fullName.trim() : 'Digital Contact';
  lines.push(`FN;CHARSET=UTF-8:${fullName}`);

  // Split name for N property
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  lines.push(`N;CHARSET=UTF-8:${lastName};${firstName};;;`);

  if (profile.companyName && profile.companyName.trim()) {
    lines.push(`ORG;CHARSET=UTF-8:${profile.companyName.trim()}`);
  }

  if (profile.jobTitle && profile.jobTitle.trim()) {
    lines.push(`TITLE;CHARSET=UTF-8:${profile.jobTitle.trim()}`);
  }

  // Construct NOTE including live card URL, bio and banking/exchange info
  const noteParts: string[] = [];
  if (liveCardUrl) {
    noteParts.push(`🌐 رابط الحسابات والبطاقة المحدثة دائماً:\\n${liveCardUrl}`);
  }

  if (profile.bio && profile.bio.trim()) {
    noteParts.push(profile.bio.trim());
  }

  if (bankAccounts && bankAccounts.length > 0) {
    const bankDetails = bankAccounts
      .map((acc) => {
        let text = `${acc.exchangeName}: ${acc.accountNumber}`;
        if (acc.accountHolderName) {
          text += ` (${acc.accountHolderName})`;
        }
        return text;
      })
      .join(' | ');
    noteParts.push(`بيانات الحسابات / Accounts: ${bankDetails}`);
  }

  if (noteParts.length > 0) {
    // In vCard 3.0, newlines in notes can be escaped as \n
    const noteText = noteParts.join(' \\n ').replace(/\r?\n/g, ' \\n ');
    lines.push(`NOTE;CHARSET=UTF-8:${noteText}`);
  }

  // Add the permanent live URL to the contact's Website field so it can be clicked inside contacts app
  if (liveCardUrl) {
    lines.push(`URL;TYPE=PREF,WORK:${liveCardUrl}`);
  }

  // Process multiple phone numbers
  phoneNumbers.forEach((p, index) => {
    if (!p.number) return;
    const cleanNum = p.number.trim();
    // Decide type
    let telType = 'CELL,VOICE';
    const labelLower = (p.label || '').toLowerCase();
    if (labelLower.includes('work') || labelLower.includes('عمل') || labelLower.includes('مكتب')) {
      telType = 'WORK,VOICE';
    } else if (labelLower.includes('home') || labelLower.includes('منزل')) {
      telType = 'HOME,VOICE';
    } else if (labelLower.includes('fax') || labelLower.includes('فاكس')) {
      telType = 'FAX';
    }

    lines.push(`TEL;TYPE=${telType}:${cleanNum}`);

    if (p.isWhatsapp) {
      const waLink = p.whatsappLink || buildWhatsappLink(cleanNum);
      if (waLink) {
        lines.push(`X-SOCIALPROFILE;TYPE=whatsapp:${waLink}`);
        if (index === 0) {
          lines.push(`URL;TYPE=WhatsApp:${waLink}`);
        }
      }
    }
  });

  const nowIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  lines.push(`REV:${nowIso}`);
  lines.push('END:VCARD');

  return lines.join('\n');
}
