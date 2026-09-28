/**
 * معلومات وروابط تشغيل تطبيقات البنوك وشركات الصرافة اليمنية
 * 
 * الآلية المعتمدة:
 * 1. بمجرد الضغط على رقم الحساب يتم نسخه فوراً إلى الحافظة.
 * 2. يتم إطلاق تطبيق البنك المحدد مباشرة وبدون أي شاشات أو نوافذ منبثقة وسيطة.
 * 3. في حال لم يكن التطبيق مثبتاً في الهاتف، يتم تحويل المستخدم تلقائياً لمتجر التطبيقات بعد ثانيتين.
 */

export interface BankAppInfo {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  colorClass: string;
  buttonBgClass: string;
  androidPackages: string[];
  schemes: string[];
  iosScheme?: string;
  playStoreUrl?: string;
}

export interface AccountData {
  accountNumber: string;
  exchangeName: string;
  accountHolderName?: string;
}

export const SUPPORTED_BANK_APPS: Record<string, BankAppInfo> = {
  bindool: {
    id: 'bindool',
    name: 'بنك بن دول للتمويل الأصغر الإسلامي / شركة بن دول للصرافة',
    shortName: 'بن دول موبايل / بنك بن دول',
    badge: 'بن دول',
    colorClass: 'text-amber-300',
    buttonBgClass: 'bg-amber-700 hover:bg-amber-600 text-white',
    androidPackages: ['com.mobile.newdemobanking'],
    schemes: ['bindowal://', 'bindowalpay://', 'bindool://'],
    iosScheme: 'bindowal://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.mobile.newdemobanking',
  },
  omqy: {
    id: 'omqy',
    name: 'شركة العمقي وإخوانه للصرافة',
    shortName: 'العمقي جوال',
    badge: 'العمقي',
    colorClass: 'text-emerald-400',
    buttonBgClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    androidPackages: ['omqy.jawal'],
    schemes: ['alomqy://', 'omqy://', 'omqyjawal://'],
    iosScheme: 'alomqy://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=omqy.jawal',
  },
  kuraimi: {
    id: 'kuraimi',
    name: 'بنك الكريمي للتمويل الأصغر الإسلامي',
    shortName: 'كريمي جوال / بنك الكريمي',
    badge: 'الكريمي',
    colorClass: 'text-amber-400',
    buttonBgClass: 'bg-amber-600 hover:bg-amber-500 text-white',
    androidPackages: ['com.KuraimiBank'],
    schemes: ['kuraimijawal://', 'kuraimi://'],
    iosScheme: 'kuraimijawal://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.KuraimiBank',
  },
  busairi: {
    id: 'busairi',
    name: 'شركة البسيري للصرافة / بنك البسيري',
    shortName: 'بنك البسيري / البسيري موبايل',
    badge: 'البسيري',
    colorClass: 'text-blue-400',
    buttonBgClass: 'bg-blue-600 hover:bg-blue-500 text-white',
    androidPackages: ['com.icsfs.busairi'],
    schemes: ['albusairi://', 'busairi://'],
    iosScheme: 'albusairi://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.icsfs.busairi',
  },
  hadhramout: {
    id: 'hadhramout',
    name: 'بنك حضرموت التجاري',
    shortName: 'بنك حضرموت / حضرموت باي',
    badge: 'حضرموت',
    colorClass: 'text-cyan-400',
    buttonBgClass: 'bg-cyan-600 hover:bg-cyan-500 text-white',
    androidPackages: ['com.icsfs.hadhramout'],
    schemes: ['hadhramout://', 'hcb://'],
    iosScheme: 'hadhramout://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.icsfs.hadhramout',
  },
  groshe: {
    id: 'groshe',
    name: 'محفظة قروشي (بنك حضرموت التجاري)',
    shortName: 'محفظة قروشي',
    badge: 'قروشي',
    colorClass: 'text-sky-400',
    buttonBgClass: 'bg-sky-600 hover:bg-sky-500 text-white',
    androidPackages: ['com.hadhramoutbank.groshe'],
    schemes: ['groshe://', 'hadhramout://'],
    iosScheme: 'groshe://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.hadhramoutbank.groshe',
  },
  qutaibi: {
    id: 'qutaibi',
    name: 'بنك القطيبي الإسلامي للتمويل الأصغر',
    shortName: 'بنك القطيبي / قطيبي موبايل',
    badge: 'القطيبي',
    colorClass: 'text-teal-400',
    buttonBgClass: 'bg-teal-600 hover:bg-teal-500 text-white',
    androidPackages: ['com.qtbbank.alqutaibi'],
    schemes: ['alqutaibi://', 'moments://'],
    iosScheme: 'alqutaibi://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.qtbbank.alqutaibi',
  },
  adencash: {
    id: 'adencash',
    name: 'محفظة عدن كاش (بنك عدن الأول الإسلامي)',
    shortName: 'عدن كاش',
    badge: 'عدن كاش',
    colorClass: 'text-rose-400',
    buttonBgClass: 'bg-rose-600 hover:bg-rose-500 text-white',
    androidPackages: ['com.adenBank.adenCash'],
    schemes: ['adencash://', 'adenbank://'],
    iosScheme: 'adencash://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.adenBank.adenCash',
  },
  amjaad: {
    id: 'amjaad',
    name: 'بنك أمجاد للتمويل الأصغر',
    shortName: 'بنك أمجاد',
    badge: 'أمجاد',
    colorClass: 'text-indigo-400',
    buttonBgClass: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    androidPackages: ['amjaad.bank'],
    schemes: ['amjaad://', 'amjaadbank://'],
    iosScheme: 'amjaad://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=amjaad.bank',
  },
  tadhamon: {
    id: 'tadhamon',
    name: 'بنك التضامن',
    shortName: 'تضامن باي / محفظتي',
    badge: 'التضامن',
    colorClass: 'text-purple-400',
    buttonBgClass: 'bg-purple-600 hover:bg-purple-500 text-white',
    androidPackages: ['com.tadhamonbank.tadhamonpay', 'com.tadhamon.mobile'],
    schemes: ['tadhamonpay://', 'tadhamon://'],
    iosScheme: 'tadhamonpay://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.tadhamonbank.tadhamonpay',
  },
  shamil: {
    id: 'shamil',
    name: 'بنك الشامل اليمني للتمويل الأصغر',
    shortName: 'شامل موبايل',
    badge: 'الشامل',
    colorClass: 'text-emerald-500',
    buttonBgClass: 'bg-emerald-700 hover:bg-emerald-600 text-white',
    androidPackages: ['com.shamil.mobile', 'com.shamilbank.mobile'],
    schemes: ['shamil://', 'shamilbank://'],
    iosScheme: 'shamil://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.shamil.mobile',
  },
  inma: {
    id: 'inma',
    name: 'شركة الإنماء للصرافة',
    shortName: 'إنماء موبايل',
    badge: 'الإنماء',
    colorClass: 'text-sky-400',
    buttonBgClass: 'bg-sky-600 hover:bg-sky-500 text-white',
    androidPackages: ['com.alinma.exchange', 'com.alinma.jawal'],
    schemes: ['alinma://', 'inma://'],
    iosScheme: 'alinma://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.alinma.exchange',
  },
  onecash: {
    id: 'onecash',
    name: 'محفظة ون كاش (OneCash)',
    shortName: 'ون كاش',
    badge: 'ون كاش',
    colorClass: 'text-red-400',
    buttonBgClass: 'bg-red-600 hover:bg-red-500 text-white',
    androidPackages: ['ye.onecash.mobile', 'com.onecash.wallet'],
    schemes: ['onecash://'],
    iosScheme: 'onecash://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=ye.onecash.mobile',
  },
  jeeb: {
    id: 'jeeb',
    name: 'محفظة جيب (بنك الكريمي)',
    shortName: 'محفظة جيب',
    badge: 'جيب',
    colorClass: 'text-amber-500',
    buttonBgClass: 'bg-amber-600 hover:bg-amber-500 text-white',
    androidPackages: ['com.kuraimi.jeeb', 'ye.com.kuraimi.jeeb'],
    schemes: ['jeeb://', 'kuraimijeeb://'],
    iosScheme: 'jeeb://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.kuraimi.jeeb',
  },
  floosak: {
    id: 'floosak',
    name: 'محفظة فلوسك (بنك اليمن والكويت)',
    shortName: 'فلوسك',
    badge: 'فلوسك',
    colorClass: 'text-blue-500',
    buttonBgClass: 'bg-blue-600 hover:bg-blue-500 text-white',
    androidPackages: ['com.ykb.floosak', 'com.ykb.wallet'],
    schemes: ['floosak://'],
    iosScheme: 'floosak://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.ykb.floosak',
  },
  cashi: {
    id: 'cashi',
    name: 'محفظة كاش (بنك سبأ الإسلامي)',
    shortName: 'كاشي',
    badge: 'كاشي',
    colorClass: 'text-green-500',
    buttonBgClass: 'bg-green-600 hover:bg-green-500 text-white',
    androidPackages: ['com.saba.cashi', 'com.sababank.cashi'],
    schemes: ['cashi://'],
    iosScheme: 'cashi://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.saba.cashi',
  },
};

export const ALL_BANK_APPS_LIST: BankAppInfo[] = Object.values(SUPPORTED_BANK_APPS);

/**
 * مطابقة اسم البنك أو الصرافة المدخل مع التطبيق المناسب
 */
export function identifyBankApp(exchangeOrBankName: string): BankAppInfo | null {
  const normalized = (exchangeOrBankName || '').toLowerCase().trim();

  if (/أمجاد|امجاد|amjaad/.test(normalized)) return SUPPORTED_BANK_APPS.amjaad;
  if (/عدن كاش|عدن_كاش|adencash|aden cash|بنك عدن/.test(normalized)) return SUPPORTED_BANK_APPS.adencash;
  if (/قروشي|groshe|قرشي/.test(normalized)) return SUPPORTED_BANK_APPS.groshe;
  if (/بن دول|بن_دول|بندول|bindool|bindowal|bin dool|دول/.test(normalized)) return SUPPORTED_BANK_APPS.bindool;
  if (/عمقي|omqy|alomqy|العمقي/.test(normalized)) return SUPPORTED_BANK_APPS.omqy;
  if (/كريمي|kuraimi|al-kuraimi|الكريمي/.test(normalized)) return SUPPORTED_BANK_APPS.kuraimi;
  if (/حضرموت|hadhramout|hcb/.test(normalized)) return SUPPORTED_BANK_APPS.hadhramout;
  if (/بسيري|busairi|al-busairi|البسيري/.test(normalized)) return SUPPORTED_BANK_APPS.busairi;
  if (/تضامن|tadhamon|التضامن/.test(normalized)) return SUPPORTED_BANK_APPS.tadhamon;
  if (/قطيبي|qutaibi|al-qutaibi|القطيبي/.test(normalized)) return SUPPORTED_BANK_APPS.qutaibi;
  if (/شامل|shamil|الشامل/.test(normalized)) return SUPPORTED_BANK_APPS.shamil;
  if (/إنماء|انماء|inma|alinma|الإنماء/.test(normalized)) return SUPPORTED_BANK_APPS.inma;
  if (/ون كاش|ون_كاش|onecash|one cash/.test(normalized)) return SUPPORTED_BANK_APPS.onecash;
  if (/جيب|jeeb/.test(normalized)) return SUPPORTED_BANK_APPS.jeeb;
  if (/فلوسك|floosak/.test(normalized)) return SUPPORTED_BANK_APPS.floosak;
  if (/كاش|كاشي|cashi/.test(normalized)) return SUPPORTED_BANK_APPS.cashi;

  return null;
}

/**
 * دالة نسخ النص فوراً وبدون تعليق للحدث (Non-blocking Fast Copy)
 */
export function copyTextToClipboard(text: string): void {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  } catch {}
}

/**
 * إطلاق نافذة نظام أندرويد الأصلية "الفتح باستخدام... / Open with"
 */
export function triggerSystemOpenWith(accountData: AccountData): void {
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const holderText = accountData.accountHolderName ? ` (${accountData.accountHolderName})` : '';
  const titleText = `حساب ${accountData.exchangeName}${holderText}: ${accountData.accountNumber}`;

  if (isAndroid) {
    const encodedPayload = encodeURIComponent(titleText);
    const chooserIntent = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodedPayload};end`;

    try {
      window.location.href = chooserIntent;
      return;
    } catch {
      const link = document.createElement('a');
      link.href = chooserIntent;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
  }

  if (navigator.share) {
    navigator.share({
      title: `حساب ${accountData.exchangeName}`,
      text: titleText,
    }).catch(() => {});
  }
}

/**
 * الحصول على رابط التشغيل المباشر لأندرويد (Intent URL)
 */
export function getBankAppLaunchUrl(bank: BankAppInfo | null): string {
  if (!bank) return '';
  const primaryPkg = bank.androidPackages && bank.androidPackages.length > 0 ? bank.androidPackages[0] : '';
  if (!primaryPkg) return '';
  return `intent://#Intent;package=${primaryPkg};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end`;
}

/**
 * الحصول على رابط صفحة التطبيق في متجر Google Play
 */
export function getBankPlayStoreUrl(bank: BankAppInfo | null): string {
  if (!bank) return '';
  const primaryPkg = bank.androidPackages && bank.androidPackages.length > 0 ? bank.androidPackages[0] : '';
  return bank.playStoreUrl || (primaryPkg ? `https://play.google.com/store/apps/details?id=${primaryPkg}` : '');
}

/**
 * محاولة فتح تطبيق البنك مباشرة
 */
export function openBankApp(bank: BankAppInfo, accountData: AccountData): void {
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const primaryPkg = bank.androidPackages && bank.androidPackages.length > 0 ? bank.androidPackages[0] : '';
  const playStoreUrl = getBankPlayStoreUrl(bank);

  if (primaryPkg) {
    // الرابط الصافي والمباشر المجرّب 100%
    const directIntent = `intent://#Intent;package=${primaryPkg};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end`;

    // محاولة التوجيه المباشر مع دعم الخروج من الـ iframe إن وجد
    try {
      if (typeof window !== 'undefined' && window.top && window.top !== window) {
        window.top.location.href = directIntent;
      } else {
        window.location.href = directIntent;
      }
    } catch {
      window.location.href = directIntent;
    }
    return;
  } 
  
  if (isIOS) {
    const iosUrl = bank.iosScheme || (bank.schemes && bank.schemes.length > 0 ? bank.schemes[0] : '');
    if (iosUrl) {
      window.location.href = iosUrl;
      return;
    }
  }

  // في حال سطح المكتب أو نظام آخر
  triggerSystemOpenWith(accountData);
}

/**
 * الدالة الأساسية لاستدعائها عند ضغط الزر: تقوم بفتح تطبيق البنك ونسخ الحساب فوراً
 */
export function copyAccountAndOpenBankApp(bank: BankAppInfo, accountData: AccountData): void {
  // 1. فتح التطبيق فوراً في أول سطر دون أي تعطيل
  openBankApp(bank, accountData);

  // 2. نسخ رقم الحساب في الخلفية للحافظة
  copyTextToClipboard(accountData.accountNumber);
}
