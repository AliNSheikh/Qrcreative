export type QRCodeType =
  | 'url'
  | 'vcard'
  | 'pdf'
  | 'images'
  | 'social'
  | 'video'
  | 'text'
  | 'business'
  | 'facebook'
  | 'wifi'
  | 'applinks'
  | 'menu'
  | 'landing'
  | 'email'
  | 'phone'
  | 'sms'
  | 'whatsapp'
  | 'location'
  | 'event'
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

export type FrameStyle =
  | 'none'
  | 'sticker-rainbow'
  | 'sticker-badge-teal'
  | 'sticker-circle-red'
  | 'frame-bottom-bar'
  | 'frame-top-bar';

export interface QRFrameConfig {
  style: FrameStyle;
  text?: string;
  color?: string;
  badgeBg?: string;
}

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
  frame?: QRFrameConfig;
  margin: number; // Quiet zone: 1 to 6
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

export interface UrlContent {
  url: string;
  trackPreciseLocation?: boolean;
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

export interface LandingPageLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  isFeatured?: boolean;
  clicksCount?: number;
}

export interface LandingPageSocial {
  platform: string;
  url: string;
}

export interface LandingPageDesign {
  theme: 'modern-blue' | 'clean-white' | 'midnight-dark' | 'sunset-coral' | 'emerald-fresh' | 'neon-cyber' | 'ocean-breeze' | 'warm-amber';
  layoutTemplate?: 'minimal' | 'business' | 'creative' | 'hero-portrait' | 'modern-card' | 'navy-wave' | 'textured-craft' | 'corporate-blue' | 'warm-split';
  buttonStyle: 'rounded' | 'pill' | 'sharp';
  buttonVariant: 'filled' | 'outline' | 'soft' | 'glass';
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: 'Noto Sans' | 'Rubik' | 'Plus Jakarta Sans' | 'Space Grotesk' | 'Playfair Display';
  coverImage?: string;
  avatarShape: 'circle' | 'rounded' | 'square';
}

export interface VCardConnectIcon {
  id: string;
  type: 'mobile' | 'email' | 'sms' | 'whatsapp' | 'phone' | 'website';
  value: string;
}

export interface VCardContactItem {
  id: string;
  type: 'phone' | 'email' | 'address';
  label: string;
  value: string;
  addressFields?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
    actionButton?: boolean;
    actionLabel?: string;
    mapUrl?: string;
  };
}

export interface VCardSocialItem {
  id: string;
  platform: string;
  url: string;
  title: string;
  subtitle?: string;
  showSubtitle: boolean;
  icon?: string;
}

export interface PdfDocumentData {
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  pageCount?: number;
  description?: string;
  companyName?: string;
  enableDownload?: boolean;
  enablePrint?: boolean;
  autoDownload?: boolean;
  previewPages?: string[];
  themeColor?: string;
}

export interface LandingPageData {
  slug: string;
  title: string;
  bio: string;
  jobTitle?: string;
  company?: string;
  brandLogo?: string;
  avatarUrl?: string;
  coverUrl?: string;
  badge?: string;
  pdfDocument?: PdfDocumentData;
  vcardTemplate?: 'hero-portrait' | 'modern-card' | 'navy-wave' | 'textured-craft' | 'corporate-blue' | 'warm-split';
  showProfilePhoto?: boolean;
  showBrandLogo?: boolean;
  showConnectIcons?: boolean;
  connectIcons?: VCardConnectIcon[];
  headingTextSection?: {
    enabled: boolean;
    title: string;
    description: string;
    showCardBg: boolean;
  };
  contactSection?: {
    enabled: boolean;
    title: string;
    showIcon: boolean;
    iconUrl?: string;
    autoSaveContact?: boolean;
    contactExchangeForm?: boolean;
    items: VCardContactItem[];
  };
  imagesSection?: {
    enabled: boolean;
    showTitleDesc: boolean;
    title?: string;
    description?: string;
    viewType: 'list' | 'grid1' | 'grid2';
    photos: string[];
    showCardBg: boolean;
  };
  socialSection?: {
    enabled: boolean;
    showTitleDesc: boolean;
    title?: string;
    description?: string;
    items: VCardSocialItem[];
  };
  links: LandingPageLink[];
  socials: LandingPageSocial[];
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    location?: string;
    website?: string;
  };
  design: LandingPageDesign;
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
  | FileContent
  | LandingPageData;

export interface QRCodeRecord {
  id: string;
  user_id: string;
  name: string;
  type: QRCodeType;
  mode: QRCodeMode;
  content: Record<string, any>;
  slug?: string; // Redirect slug for editable mode e.g. "landingpageurl"
  destination_url?: string; // Target URL for editable redirect
  landing_page?: LandingPageData; // Landing page customization
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
  country?: string;
  country_code?: string;
  city?: string;
  browser?: string;
  os?: string;
  ip?: string;
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
