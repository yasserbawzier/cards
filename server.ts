import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { processDigitalCardWithAI } from './server/engine';
import { BankAccount, PhoneNumber, Profile } from './src/types';
import { buildWhatsappLink, generateCardId, generateVCardString } from './src/utils/vcard';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

/**
 * PRIMARY AI BACKEND ENGINE ENDPOINT:
 * POST /api/generate-card
 *
 * Receives raw unorganized text or structured inputs and returns strictly valid JSON
 * matching the exact Digital Business Card & vCard specification.
 */
app.post('/api/generate-card', async (req, res) => {
  try {
    const { rawInput, structuredData } = req.body || {};

    if (rawInput && typeof rawInput === 'string' && rawInput.trim()) {
      const result = await processDigitalCardWithAI(rawInput.trim());
      // STRICT JSON OUTPUT: matches exact schema directly
      return res.json(result.data);
    }

    if (structuredData) {
      const { fullName, companyName, jobTitle, phoneNumbers, bankAccounts, bio } = structuredData;

      const profile: Profile = {
        fullName: fullName?.trim() || 'اسم المستخدم',
        companyName: companyName?.trim() || 'الشركة',
        jobTitle: jobTitle?.trim() || 'المنصب',
        bio: bio?.trim() || `${jobTitle || 'المدير'} في ${companyName || 'الشركة'}. نسعى لتقديم أفضل الخدمات والحلول المبتكرة لعملائنا وشركائنا.`,
      };

      const formattedPhones: PhoneNumber[] = (phoneNumbers || []).map((p: { label?: string; number: string; isWhatsapp?: boolean }) => ({
        label: p.label || 'الهاتف',
        number: p.number,
        isWhatsapp: Boolean(p.isWhatsapp),
        whatsappLink: p.isWhatsapp ? buildWhatsappLink(p.number) : null,
      }));

      const formattedBankAccounts: BankAccount[] = (bankAccounts || []).map((b: { exchangeName: string; accountNumber: string; accountHolderName?: string }) => ({
        exchangeName: b.exchangeName,
        accountNumber: b.accountNumber,
        accountHolderName: b.accountHolderName || undefined,
      }));

      const cardId = generateCardId(profile.fullName, profile.companyName);
      const vcardRaw = generateVCardString(profile, formattedPhones, formattedBankAccounts);

      const responsePayload = {
        cardId,
        profile,
        phoneNumbers: formattedPhones,
        bankAccounts: formattedBankAccounts,
        vcardRaw,
      };

      return res.json(responsePayload);
    }

    return res.status(400).json({
      error: 'Either rawInput or structuredData is required in request body.',
    });
  } catch (error) {
    console.error('Error generating digital card:', error);
    res.status(500).json({
      error: 'Internal Server Error processing card details.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Direct .vcf File Download Endpoint
 * GET /api/vcard/download or POST /api/vcard/download
 */
app.all('/api/vcard/download', (req, res) => {
  const vcardRaw = req.method === 'POST' ? req.body?.vcardRaw : req.query?.vcardRaw;
  const filename = (req.method === 'POST' ? req.body?.filename : req.query?.filename) || 'contact.vcf';

  if (!vcardRaw || typeof vcardRaw !== 'string') {
    return res.status(400).send('Missing vcardRaw string');
  }

  res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.send(vcardRaw);
});

// Vite Middleware for development & Static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Business Card AI Engine server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
