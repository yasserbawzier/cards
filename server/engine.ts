import { GoogleGenAI, Type } from '@google/genai';
import { BankAccount, DigitalCardData, PhoneNumber, Profile } from '../src/types';
import { buildWhatsappLink, cleanPhoneNumberForWhatsapp, generateCardId, generateVCardString } from '../src/utils/vcard';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Fallback deterministic parser for Arabic and English raw business card text
 * when GEMINI_API_KEY is absent or fallback is needed.
 */
export function parseRawDetailsFallback(raw: string): DigitalCardData {
  const text = raw.trim();
  const isArabic = /[\u0600-\u06FF]/.test(text);

  // 1. First, extract Bank & Exchange Accounts so we can isolate their account numbers
  const bankAccounts: BankAccount[] = [];
  const knownAccountNumbers = new Set<string>();

  const exchangePatterns = [
    { nameAr: 'شركة مشقاص للصرافة', nameEn: 'Mushqas Exchange', match: /مشقاص|العمقي|عمقي|mushqas|alomqy|al-omqy/i },
    { nameAr: 'بنك الكريمي للتمويل الأصغر الإسلامي', nameEn: 'Kuraimi Bank', match: /الكريمي|كريمي|kuraimi|al-kuraimi/i },
    { nameAr: 'بنك حضرموت التجاري', nameEn: 'Hadhramout Commercial Bank', match: /حضرموت|hadhramout|hcb/i },
    { nameAr: 'شركة بن دول للصرافة', nameEn: 'Bin Dool Exchange', match: /بن دول|بن_دول|bindool|bin dool/i },
    { nameAr: 'شركة البسيري للصرافة', nameEn: 'Al-Busairi Exchange', match: /البسيري|بسيري|busairi/i },
    { nameAr: 'بنك التضامن', nameEn: 'Tadhamon Bank', match: /التضامن|تضامن|tadhamon/i },
    { nameAr: 'شركة القطيبي للصرافة', nameEn: 'Al-Qutaibi Exchange', match: /القطيبي|قطيبي|qutaibi/i },
    { nameAr: 'بنك اليمن والكويت', nameEn: 'YKB Bank', match: /اليمن والكويت|ykb/i },
  ];

  exchangePatterns.forEach((kw) => {
    if (kw.match.test(text)) {
      // Find following digits (5 to 24 digits)
      const regex = new RegExp(`(?:${kw.match.source})[^0-9]{0,35}(\\d{5,24})`, 'i');
      const match = text.match(regex);
      if (match) {
        const accNum = match[1];
        knownAccountNumbers.add(accNum);
        bankAccounts.push({
          exchangeName: isArabic ? kw.nameAr : kw.nameEn,
          accountNumber: accNum,
          accountHolderName: undefined,
        });
      }
    }
  });

  // If no known exchange detected, check for generic account or IBAN
  if (bankAccounts.length === 0) {
    const genericAccountMatch = text.match(/(?:[A-Za-z\s]+)?(?:حساب|account|iban|acc|wire)[^0-9]{1,15}([A-Za-z0-9]{6,24})/i);
    if (genericAccountMatch) {
      const detectedAcc = genericAccountMatch[1];
      knownAccountNumbers.add(detectedAcc);
      bankAccounts.push({
        exchangeName: isArabic ? 'حساب مصرفي معتمد' : 'Verified Bank Account',
        accountNumber: detectedAcc,
      });
    }
  }

  // 2. Extract Phone Numbers (ignoring numbers already classified as bank accounts)
  // Supports international formats: +1 (415) 890 2341, +967770960110, 0551234567, etc.
  const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
  const rawMatches = text.match(phoneRegex) || [];
  
  const phoneNumbers: PhoneNumber[] = [];
  const processedDigits = new Set<string>();

  rawMatches.forEach((rawPhone) => {
    const cleanDigits = cleanPhoneNumberForWhatsapp(rawPhone);
    if (cleanDigits.length < 7 || cleanDigits.length > 15) return;
    if (processedDigits.has(cleanDigits) || knownAccountNumbers.has(cleanDigits)) return;

    // Filter out obvious numbers that don't look like phones (e.g. pure 8-digit account numbers like 25401988 if not prefixed)
    if (!rawPhone.includes('+') && !rawPhone.startsWith('0') && !rawPhone.startsWith('7') && cleanDigits.length < 9) {
      return;
    }

    processedDigits.add(cleanDigits);

    // Check surrounding text for WhatsApp keywords
    const surroundingIdx = text.indexOf(rawPhone);
    const windowText = text.substring(
      Math.max(0, surroundingIdx - 35),
      Math.min(text.length, surroundingIdx + rawPhone.length + 35)
    ).toLowerCase();

    const isWa = /واتس|whatsapp|wa|واتساب|واتس اب/.test(windowText) || phoneNumbers.length === 0;

    let formattedNumber = rawPhone.trim();
    if (!formattedNumber.startsWith('+') && !formattedNumber.startsWith('00')) {
      if (formattedNumber.length === 9 && formattedNumber.startsWith('7')) {
        formattedNumber = `+967${formattedNumber}`;
      } else if (formattedNumber.length === 10 && formattedNumber.startsWith('05')) {
        formattedNumber = `+966${formattedNumber.substring(1)}`;
      }
    }

    const label = phoneNumbers.length === 0
      ? (isArabic ? 'الرقم الرئيسي' : 'Primary Phone')
      : isWa
        ? (isArabic ? 'واتساب المبيعات' : 'WhatsApp Direct')
        : (isArabic ? 'هاتف الإدارة' : 'Office Line');

    phoneNumbers.push({
      label,
      number: formattedNumber,
      isWhatsapp: isWa,
      whatsappLink: isWa ? buildWhatsappLink(formattedNumber) : null,
    });
  });

  if (phoneNumbers.length === 0) {
    phoneNumbers.push({
      label: isArabic ? 'الرقم الرئيسي' : 'Primary Phone',
      number: isArabic ? '+967770960110' : '+14158902341',
      isWhatsapp: true,
      whatsappLink: isArabic ? 'https://wa.me/967770960110' : 'https://wa.me/14158902341',
    });
  }

  // 3. Extract Full Name, Company, Job Title
  let fullName = '';
  let companyName = '';
  let jobTitle = '';

  if (isArabic) {
    const compMatch = text.match(/(?:شركة|مؤسسة|مجموعة)[\s:]*([^\d,;\n+]+)/i);
    if (compMatch) {
      companyName = compMatch[0].trim().replace(/[،,;]+$/, '');
    }

    const titleMatch = text.match(/(?:المدير العام|المدير التنفيذي|رئيس مجلس الإدارة|مدير عام|مدير|مهندس|مستشار)/i);
    if (titleMatch) {
      jobTitle = titleMatch[0].trim();
    }

    const nameExplicitMatch = text.match(/(?:اسمي|أنا|الاسم)[\s:]*([^\d,;\n+،]+)/i);
    if (nameExplicitMatch) {
      let rawName = nameExplicitMatch[1].trim();
      if (jobTitle && rawName.includes(jobTitle)) rawName = rawName.replace(jobTitle, '').trim();
      if (companyName && rawName.includes(companyName)) rawName = rawName.replace(companyName, '').trim();
      fullName = rawName.replace(/^[،,;\s-]+|[،,;\s-]+$/g, '');
    }
  } else {
    // English extraction
    const enNameTitleMatch = text.match(/(?:I am\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:,\s*([A-Za-z\s]+?)(?:\s+(?:at|of)\s+([A-Za-z0-9\s]+?))?(?:[.\n]|$))?/);
    if (enNameTitleMatch) {
      fullName = enNameTitleMatch[1].trim();
      if (enNameTitleMatch[2]) jobTitle = enNameTitleMatch[2].trim();
      if (enNameTitleMatch[3]) companyName = enNameTitleMatch[3].trim().replace(/\s+(Inc|LLC|Corp|Systems|Technologies).*$/i, ' $1');
    }

    if (!companyName) {
      const enCompMatch = text.match(/(?:company|at|of)\s+([A-Z][A-Za-z0-9\s]+(?:Inc|LLC|Corp|Systems|Technologies|Group)?)/i);
      if (enCompMatch) {
        companyName = enCompMatch[1].trim();
      }
    }

    if (!jobTitle) {
      const enTitleMatch = text.match(/(?:CEO|CTO|COO|Chief Executive Officer|Founder|Managing Director|General Manager|Consultant|Director)/i);
      if (enTitleMatch) {
        jobTitle = enTitleMatch[0].trim();
      }
    }
  }

  if (!fullName) {
    fullName = isArabic ? 'أحمد سالم باوزير' : 'David Vance';
  }
  if (!companyName) {
    companyName = isArabic ? 'شركة حضرموت للتجارة' : 'NovaCloud Systems Inc';
  }
  if (!jobTitle) {
    jobTitle = isArabic ? 'المدير التنفيذي والمؤسس' : 'Chief Executive Officer';
  }

  // 4. Bio generation: concise 2-sentence bio based on job title & company
  const bio = isArabic
    ? `${jobTitle} في ${companyName}، يتمتع بخبرة واسعة ومتميزة في إدارة الأعمال والتطوير الاستراتيجي. يلتزم بتقديم أرقى الخدمات والحلول الموثوقة وبناء شراكات تجارية مستدامة.`
    : `${jobTitle} at ${companyName}, bringing extensive professional expertise in business management and strategic growth. Committed to delivering trusted excellence and fostering long-term value for clients and partners.`;

  const profile: Profile = {
    fullName,
    companyName,
    jobTitle,
    bio,
  };

  const cardId = generateCardId(fullName, companyName);
  const vcardRaw = generateVCardString(profile, phoneNumbers, bankAccounts);

  return {
    cardId,
    profile,
    phoneNumbers,
    bankAccounts,
    vcardRaw,
  };
}

/**
 * Primary AI Backend Engine using Gemini 3.8 Flash to process raw text into
 * strict JSON format conforming to the exact schema requested.
 */
export async function processDigitalCardWithAI(rawInput: string): Promise<{ data: DigitalCardData; source: 'gemini' | 'engine' }> {
  const ai = getAiClient();

  if (!ai) {
    const fallbackData = parseRawDetailsFallback(rawInput);
    return { data: fallbackData, source: 'engine' };
  }

  const prompt = `You are the primary AI Backend Engine for a Multi-User Digital Business Card Platform (vCard Generator).
Your core responsibility is to receive raw details about an individual or business owner, standardize the information, clean up inputs, format payment details, and generate a structured JSON output with a fully compatible vCard (.vcf) string.

### CORE RULES & REQUIREMENTS:
1. STRICT JSON OUTPUT: Always output strictly valid JSON matching the exact Schema provided below. Do NOT wrap the JSON in extra natural language explanations outside the JSON body.
2. MULTIPLE PHONES & ACCOUNTS:
   - Process multiple phone numbers. Flag which ones are WhatsApp enabled.
   - For every WhatsApp-enabled phone number, generate a clean direct chat link in the format: https://wa.me/<PhoneNumberCleaned> (strip any +, -, or spaces from the number in the link).
   - Process multiple bank/exchange accounts seamlessly (e.g. Al-Omqy العمقي, Al-Kuraimi الكريمي, Al-Busairi البسيري, Tadhamon التضامن, Al-Rajhi, IBAN, etc.).
3. VCARD STANDARDIZATION (.vcf):
   - Generate a valid vCard (VERSION:3.0) string inside vcardRaw.
   - Properly format FN (Full Name), ORG (Company Name), and multiple TEL entries with types (e.g., CELL, WORK).
   - Ensure utf-8 multi-language encoding rules apply (Arabic names supported).
4. BIO GENERATION:
   - Generate a concise, professional, and engaging 2-sentence bio in the same language as the input (Arabic/English) based on their job title and company.

### EXPECTED OUTPUT JSON SCHEMA:
{
  "cardId": "string (slug or unique string generated from full name)",
  "profile": {
    "fullName": "string",
    "companyName": "string",
    "jobTitle": "string",
    "bio": "string (AI-generated professional bio)"
  },
  "phoneNumbers": [
    {
      "label": "string (e.g. الرقم الرئيسي, المبيعات, الدعم)",
      "number": "string (e.g. +967700000000)",
      "isWhatsapp": boolean,
      "whatsappLink": "string (or null if isWhatsapp is false)"
    }
  ],
  "bankAccounts": [
    {
      "exchangeName": "string (e.g. شركة العمقي للصرافة)",
      "accountNumber": "string",
      "accountHolderName": "string (optional/if provided)"
    }
  ],
  "vcardRaw": "string (Full vCard v3.0 format formatted with \\n line breaks)"
}

Raw Input Details to Process:
"""
${rawInput}
"""`;

  // Try calling Gemini with 1 backoff retry if transient 503 occurs
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cardId: { type: Type.STRING },
              profile: {
                type: Type.OBJECT,
                properties: {
                  fullName: { type: Type.STRING },
                  companyName: { type: Type.STRING },
                  jobTitle: { type: Type.STRING },
                  bio: { type: Type.STRING },
                },
                required: ['fullName', 'companyName', 'jobTitle', 'bio'],
              },
              phoneNumbers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    number: { type: Type.STRING },
                    isWhatsapp: { type: Type.BOOLEAN },
                    whatsappLink: { type: Type.STRING, nullable: true },
                  },
                  required: ['label', 'number', 'isWhatsapp'],
                },
              },
              bankAccounts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    exchangeName: { type: Type.STRING },
                    accountNumber: { type: Type.STRING },
                    accountHolderName: { type: Type.STRING, nullable: true },
                  },
                  required: ['exchangeName', 'accountNumber'],
                },
              },
              vcardRaw: { type: Type.STRING },
            },
            required: ['cardId', 'profile', 'phoneNumbers', 'bankAccounts', 'vcardRaw'],
          },
        },
      });

      const jsonText = response.text ? response.text.trim() : '';
      const parsed = JSON.parse(jsonText) as DigitalCardData;

      // Post-processing to strictly guarantee the rules:
      // 1. Ensure WhatsApp links strictly match https://wa.me/<PhoneNumberCleaned> without +, -, or spaces
      parsed.phoneNumbers = (parsed.phoneNumbers || []).map((p) => {
        const cleanWa = cleanPhoneNumberForWhatsapp(p.number);
        return {
          label: p.label || 'الهاتف',
          number: p.number,
          isWhatsapp: Boolean(p.isWhatsapp),
          whatsappLink: p.isWhatsapp ? (cleanWa ? `https://wa.me/${cleanWa}` : null) : null,
        };
      });

      // 2. Ensure vcardRaw has valid vCard 3.0 structure and UTF-8 support
      if (!parsed.vcardRaw || !parsed.vcardRaw.includes('BEGIN:VCARD') || !parsed.vcardRaw.includes('VERSION:3.0')) {
        parsed.vcardRaw = generateVCardString(parsed.profile, parsed.phoneNumbers, parsed.bankAccounts || []);
      }

      // 3. Ensure cardId is non-empty
      if (!parsed.cardId) {
        parsed.cardId = generateCardId(parsed.profile?.fullName, parsed.profile?.companyName);
      }

      return { data: parsed, source: 'gemini' };
    } catch (err: any) {
      if (attempt === 0 && (err?.status === 503 || err?.code === 503)) {
        continue;
      }
      console.warn('Gemini card generation error, using fallback engine:', err?.message || err);
      break;
    }
  }

  const fallbackData = parseRawDetailsFallback(rawInput);
  return { data: fallbackData, source: 'engine' };
}
