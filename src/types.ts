export interface Profile {
  fullName: string;
  companyName: string;
  jobTitle: string;
  bio: string;
}

export interface PhoneNumber {
  label: string;
  number: string;
  isWhatsapp: boolean;
  whatsappLink: string | null;
}

export interface BankAccount {
  exchangeName: string;
  accountNumber: string;
  accountHolderName?: string;
}

export interface DigitalCardData {
  cardId: string;
  ownerId?: string;
  profile: Profile;
  phoneNumbers: PhoneNumber[];
  bankAccounts: BankAccount[];
  vcardRaw: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateCardRequest {
  rawInput?: string;
  structuredData?: {
    fullName: string;
    companyName: string;
    jobTitle: string;
    phoneNumbers: Array<{ label: string; number: string; isWhatsapp: boolean }>;
    bankAccounts: Array<{ exchangeName: string; accountNumber: string; accountHolderName?: string }>;
    language?: 'ar' | 'en';
  };
}

export interface ApiGenerateCardResponse {
  success: boolean;
  data?: DigitalCardData;
  error?: string;
  source?: 'gemini' | 'engine';
}
