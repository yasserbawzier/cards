export interface SampleTemplate {
  id: string;
  name: string;
  nameAr: string;
  rawText: string;
}

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: 'yemen-merchant',
    name: 'Yemeni Merchant & Exchange Accounts',
    nameAr: 'تاجر يمني (العمقي والكريمي والبسيري)',
    rawText: `السلام عليكم،
أنا المهندس أحمد سالم باوزير
المدير التنفيذي لـ شركة حضرموت للتجارة والاستيراد
للتواصل معنا:
رقم الاتصال المباشر والعمل: +967770960110 (مفعل واتساب)
رقم المبيعات والطلبيات: +967733445566 (واتس اب فقط)
هاتف المكتب والإدارة: +96705301234

بيانات الحسابات البنكية والصرافة المعتمدة لتحويل المبالغ:
- شركة العمقي للصرافة: حساب رقم 25401988 (باسم أحمد سالم)
- بنك الكريمي للتمويل الأصغر الإسلامي: حساب مميز 77096011
- شركة البسيري للصرافة: حساب رقم 908123`,
  },
  {
    id: 'gulf-agency',
    name: 'Gulf Business Consultant',
    nameAr: 'استشارات وتطوير أعمال (الراجحي والأهلي)',
    rawText: `مرحباً،
عبد الرحمن فهد القحطاني
مؤسس ورئيس مجلس إدارة شركة أفق الرياض للحلول الرقمية
جوال الإدارة الرئيسي: +966551234567 (واتساب مفعل)
خدمة العملاء والدعم الفني: +966509876543 (اتصال وواتساب)

الحسابات البنكية للمؤسسة:
- مصرف الراجحي: حساب رقم 482000192837465 (آيبان SA482000000192837465)
- البنك الأهلي السعودي: حساب رقم 1029384756`,
  },
  {
    id: 'tech-founder-en',
    name: 'International Tech Founder (English)',
    nameAr: 'مؤسس شركة تقنية دولية (إنجليزي)',
    rawText: `Hi there,
I am David Vance, Chief Executive Officer at NovaCloud Systems Inc.
Reach me directly:
Primary Mobile: +1 (415) 890-2341 (WhatsApp enabled)
Operations & Escalations: +44 20 7946 0912 (WhatsApp direct)
Office Desk: +1 (415) 555-0199

Payment and Corporate Accounts:
- Silicon Valley Bank: Account #983471029 (Routing 121000358)
- TransferWise / Wise Multi-currency: Account #GB82WEST12345678`,
  },
];
