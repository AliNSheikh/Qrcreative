export type QRCodeType =
  | 'url'
  | 'text'
  | 'email'
  | 'phone'
  | 'sms'
  | 'whatsapp'
  | 'wifi'
  | 'vcard'
  | 'location'
  | 'event'
  | 'social'
  | 'applinks'
  | 'file';

export type QRCodeMode = 'static' | 'editable';

export type DotStyle = 'square' | 'rounded' | 'dots' | 'extra-rounded';
export type CornerSquareStyle = 'square' | 'rounded' | 'extra-rounded' | 'circle';
export type CornerDotStyle = 'square' | 'rounded' | 'dot';

export type TemplatePreset =
  | 'minimal'
  | 'bold'
  | 'soft'
  | 'tech'
  | 'mono'
  | 'gradient'
  | 'business'
  | 'creative';

export interface QRCodeDesign {
  template: TemplatePreset;
  dotStyle: DotStyle;
  cornerSquareStyle: CornerSquareStyle;
  cornerDotStyle: CornerDotStyle;
  foregroundColor: string;
  backgroundColor: string;
  gradient: {
    enabled: boolean;
    type: 'linear' | 'radial';
    color2: string;
    angle: number;
  };
  logo: {
    url: string | null;
    size: number; // 10 to 30 % of QR code
    padding: number; // 0 to 16 px
    shape: 'square' | 'circle' | 'none';
  };
  margin: number; // Quiet zone: 1 to 6
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

export interface UrlContent {
  url: string;
}

export interface TextContent {
  text: string;
}

export interface EmailContent {
  email: string;
  subject: string;
  message: string;
}

export interface PhoneContent {
  phone: string;
}

export interface SmsContent {
  phone: string;
  message: string;
}

export interface WhatsAppContent {
  phone: string;
  message: string;
}

export interface WifiContent {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardContent {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  phone: string;
  email: string;
  website: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface LocationContent {
  latitude: string;
  longitude: string;
  query?: string;
}

export interface EventContent {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface SocialContent {
  links: Array<{
    platform: string;
    url: string;
  }>;
}

export interface AppLinksContent {
  iosUrl: string;
  androidUrl: string;
  fallbackUrl: string;
}

export interface FileContent {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
}

export type QRCodeContent =
  | UrlContent
  | TextContent
  | EmailContent
  | PhoneContent
  | SmsContent
  | WhatsAppContent
  | WifiContent
  | VCardContent
  | LocationContent
  | EventContent
  | SocialContent
  | AppLinksContent
  | FileContent;

export interface QRCodeRecord {
  id: string;
  user_id: string;
  name: string;
  type: QRCodeType;
  mode: QRCodeMode;
  content: Record<string, any>;
  slug?: string; // Redirect slug for editable mode e.g. "X7PA91"
  destination_url?: string; // Target URL for editable redirect
  design: QRCodeDesign;
  is_active: boolean;
  scans_count: number;
  created_at: string;
  updated_at: string;
}

export interface QRScanRecord {
  id: string;
  qr_code_id: string;
  scanned_at: string;
  referrer: string;
  user_agent: string;
  device_type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImage?: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
}
