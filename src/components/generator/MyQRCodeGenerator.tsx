import React, { useState, useEffect, useRef } from 'react';
import {
  QRCodeType,
  QRCodeMode,
  QRCodeDesign,
  QRCodeRecord,
  UserProfile,
  LandingPageData,
  LandingPageLink
} from '../../types';
import {
  formatQRContent,
  renderQRToCanvas,
  generateQRSVG,
  DESIGN_TEMPLATES
} from '../../lib/qr/generator';
import { saveQRCode } from '../../lib/storage';
import { getSiteUrl, getLandingPageUrl } from '../../lib/config';
import { LandingPageEditor } from '../landing/LandingPageEditor';
import { PhoneMockupPreview } from '../landing/PhoneMockupPreview';
import { UrlQRCodeEditor } from './UrlQRCodeEditor';
import { VCardQRCodeEditor } from './VCardQRCodeEditor';
import { PdfQRCodeEditor } from './PdfQRCodeEditor';
import {
  Globe,
  Contact,
  FileText,
  Image as ImageIcon,
  Share2,
  Video,
  AlignLeft,
  Briefcase,
  Facebook,
  Wifi,
  Smartphone,
  Utensils,
  ArrowLeft,
  ArrowRight,
  Download,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  QrCode,
  Palette,
  Layers,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Feather,
  Lock,
  Star,
  Info,
  Link2
} from 'lucide-react';

interface MyQRCodeGeneratorProps {
  currentUser: UserProfile | null;
  onOpenAuth: (prompt?: string) => void;
  onQRSaved?: (qr: QRCodeRecord) => void;
  editingQR?: QRCodeRecord | null;
  onCancelEdit?: () => void;
  initialType?: QRCodeType;
}

// 12 exact types from https://myqrcode.com/generator
interface GeneratorTypeCard {
  type: QRCodeType;
  title: string;
  description: string;
  path: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  isLandingType: boolean;
}

const GENERATOR_CARDS: GeneratorTypeCard[] = [
  {
    type: 'url',
    title: 'Website URL',
    description: 'Create a custom URL QR code with stickers, colors, and live tracking',
    path: '/generator/url',
    badge: 'Direct or Dynamic',
    icon: Globe,
    isLandingType: false
  },
  {
    type: 'vcard',
    title: 'vCard',
    description: 'Share your electronic business card or contact landing page',
    path: '/generator/vcard',
    badge: 'Landing or Direct',
    icon: Contact,
    isLandingType: true
  },
  {
    type: 'pdf',
    title: 'PDF',
    description: 'Show a PDF with file details and download button',
    path: '/generator/pdf',
    badge: 'Landing Page',
    icon: FileText,
    isLandingType: true
  },
  {
    type: 'images',
    title: 'Images',
    description: 'Display an image gallery with social links',
    path: '/generator/images',
    badge: 'Landing Page',
    icon: ImageIcon,
    isLandingType: true
  },
  {
    type: 'social',
    title: 'Social Media',
    description: 'Share all your social media channels in one place',
    path: '/generator/social-media',
    badge: 'Landing Page',
    icon: Share2,
    isLandingType: true
  },
  {
    type: 'video',
    title: 'Video',
    description: 'Share one or multiple video embeds and links',
    path: '/generator/video',
    badge: 'Landing Page',
    icon: Video,
    isLandingType: true
  },
  {
    type: 'text',
    title: 'Simple Text',
    description: 'Display plain text directly on camera scan',
    path: '/generator/plain-text',
    badge: 'Direct Scan',
    icon: AlignLeft,
    isLandingType: false
  },
  {
    type: 'business',
    title: 'Business Page',
    description: 'Share your company information and services',
    path: '/generator/business-page',
    badge: 'Landing Page',
    icon: Briefcase,
    isLandingType: true
  },
  {
    type: 'facebook',
    title: 'Facebook',
    description: 'Share your Facebook page and creator presence',
    path: '/generator/facebook',
    badge: 'Landing Page',
    icon: Facebook,
    isLandingType: true
  },
  {
    type: 'wifi',
    title: 'Wi-Fi',
    description: 'Connect directly to a wireless network with no page',
    path: '/generator/wifi',
    badge: 'Direct Connect',
    icon: Wifi,
    isLandingType: false
  },
  {
    type: 'applinks',
    title: 'App',
    description: 'Link to iOS App Store & Google Play downloads',
    path: '/generator/app',
    badge: 'Landing Page',
    icon: Smartphone,
    isLandingType: true
  },
  {
    type: 'menu',
    title: 'Menu',
    description: 'Create a responsive digital restaurant menu',
    path: '/generator/menu',
    badge: 'Landing Page',
    icon: Utensils,
    isLandingType: true
  }
];

export const MyQRCodeGenerator: React.FC<MyQRCodeGeneratorProps> = ({
  currentUser,
  onOpenAuth,
  onQRSaved,
  editingQR = null,
  onCancelEdit,
  initialType = 'url'
}) => {
  // Step state: 1 = choose content, 2 = edit content & landing page, 3 = design QR & download
  const [step, setStep] = useState<1 | 2 | 3>(editingQR ? 2 : 1);
  const [selectedType, setSelectedType] = useState<QRCodeType>(editingQR?.type || initialType);

  // QR Name
  const [qrName, setQrName] = useState(editingQR?.name || 'My QR Code');

  // Preview tab in desktop side-column: 'landing' or 'qr'
  const [previewTab, setPreviewTab] = useState<'landing' | 'qr'>('landing');

  // Landing page data
  const [landingData, setLandingData] = useState<LandingPageData>(() => {
    if (editingQR?.landing_page) return editingQR.landing_page;
    if (editingQR?.content?.landingPage) return editingQR.content.landingPage;

    const defaultSlug = editingQR?.slug || Math.random().toString(36).substring(2, 8);
    return {
      slug: defaultSlug,
      title: editingQR?.name || 'My Creative Page',
      bio: 'Welcome! Scan and explore all our links, social channels, and resources below.',
      avatarUrl: '',
      coverUrl: '',
      badge: 'Verified Page',
      links: [
        {
          id: 'link_1',
          title: 'Official Website',
          url: 'https://qrcreative.vercel.app',
          description: 'Explore our latest updates and offerings',
          icon: 'globe',
          isActive: true,
          clicksCount: 0
        },
        {
          id: 'link_2',
          title: 'Online Catalog & Store',
          url: 'https://qrcreative.vercel.app',
          description: 'Browse our full product catalog',
          icon: 'store',
          isActive: true,
          clicksCount: 0
        }
      ],
      socials: [
        { platform: 'instagram', url: 'https://instagram.com' },
        { platform: 'twitter', url: 'https://twitter.com' },
        { platform: 'whatsapp', url: 'https://wa.me/' }
      ],
      contact: {
        email: 'contact@brand.com',
        phone: '+1 555 123 4567',
        whatsapp: '+1 555 123 4567',
        location: 'New York, NY'
      },
      design: {
        theme: 'modern-blue',
        buttonStyle: 'rounded',
        buttonVariant: 'filled',
        primaryColor: '#4981ff',
        backgroundColor: '#ffffff',
        textColor: '#0a0909',
        fontFamily: 'Rubik',
        avatarShape: 'circle'
      }
    };
  });

  // Standard QR content for non-landing or fallback
  const [content, setContent] = useState<Record<string, any>>(
    editingQR?.content || {
      url: 'https://qrcreative.vercel.app',
      text: '',
      ssid: '',
      password: '',
      encryption: 'WPA',
      hidden: false
    }
  );

  // QR Design
  const [design, setDesign] = useState<QRCodeDesign>(
    editingQR?.design || {
      template: 'minimal',
      dotStyle: 'square',
      cornerSquareStyle: 'square',
      cornerDotStyle: 'square',
      foregroundColor: '#0a0909',
      backgroundColor: '#ffffff',
      gradient: {
        enabled: false,
        type: 'linear',
        color2: '#4981ff',
        angle: 45
      },
      logo: {
        url: null,
        size: 20,
        padding: 4,
        shape: 'square'
      },
      margin: 3,
      errorCorrectionLevel: 'M'
    }
  );

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  // Determine if current QR code is a landing page or direct scan
  const [useLandingPage, setUseLandingPage] = useState<boolean>(() => {
    if (editingQR) {
      return Boolean(editingQR.landing_page);
    }
    const card = GENERATOR_CARDS.find((c) => c.type === (initialType || 'url'));
    return card ? card.isLandingType : true;
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate destination URL / encoded payload
  // When useLandingPage is true, encodes https://qrcreative.vercel.app/${slug}
  // When false, encodes the direct format (e.g. WIFI:..., raw URL, or plain text)
  const isLandingType = useLandingPage;
  const currentSlug = (landingData.slug || '').trim().replace(/^\//, '');
  const destinationUrl = isLandingType
    ? getLandingPageUrl(currentSlug || 'qr')
    : selectedType === 'url'
    ? content.url || getSiteUrl()
    : formatQRContent(selectedType, content);

  // Re-render QR code whenever design, content, or landing mode changes
  useEffect(() => {
    let active = true;

    async function updateQR() {
      if (!canvasRef.current) return;
      try {
        const textToEncode = isLandingType ? destinationUrl : formatQRContent(selectedType, content);
        await renderQRToCanvas(canvasRef.current, textToEncode, design, 300);
      } catch (err) {
        console.error('Failed to render QR Code:', err);
      }
    }

    updateQR();
    return () => {
      active = false;
    };
  }, [design, destinationUrl, selectedType, content, isLandingType]);

  // Handle Card Click from Step 1
  const handleSelectCard = (card: GeneratorTypeCard) => {
    setSelectedType(card.type);
    if (!card.isLandingType) {
      setUseLandingPage(false);
      setPreviewTab('qr');
    } else {
      setUseLandingPage(true);
      setPreviewTab('landing');
    }

    // Tailor initial title / badge based on type
    if (card.type === 'menu') {
      setLandingData((prev) => ({
        ...prev,
        title: prev.title === 'My Creative Page' ? 'Our Seasonal Menu' : prev.title,
        badge: 'Digital Menu',
        design: {
          ...prev.design,
          layoutTemplate: prev.design?.layoutTemplate || 'creative'
        }
      }));
    } else if (card.type === 'vcard' || card.type === 'business') {
      setLandingData((prev) => ({
        ...prev,
        title: prev.title === 'My Creative Page' ? (currentUser?.display_name || 'My Electronic Card') : prev.title,
        badge: 'Business Contact',
        design: {
          ...prev.design,
          layoutTemplate: prev.design?.layoutTemplate || 'business'
        }
      }));
    }
    setStep(2);
  };

  // Download Handler
  const handleDownload = async (format: 'png' | 'svg' | 'pdf') => {
    const textToEncode = isLandingType ? destinationUrl : formatQRContent(selectedType, content);

    if (format === 'svg') {
      const svg = await generateQRSVG(textToEncode, design);
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${qrName.toLowerCase().replace(/\s+/g, '-')}-qr.svg`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === 'png' && canvasRef.current) {
      const offscreen = document.createElement('canvas');
      await renderQRToCanvas(offscreen, textToEncode, design, 1200);
      const dataUrl = offscreen.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${qrName.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
      a.click();
      return;
    }

    if (format === 'pdf') {
      const offscreen = document.createElement('canvas');
      await renderQRToCanvas(offscreen, textToEncode, design, 1200);
      const imgData = offscreen.toDataURL('image/png');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head><title>${qrName} - Print QR</title></head>
            <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
              <h2>${qrName}</h2>
              <img src="${imgData}" style="width:360px;height:360px;" />
              <p style="color:#666;font-size:14px;margin-top:16px;">Scan to open ${destinationUrl}</p>
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  // Save QR Code with Landing Page or Direct Content
  const handleSave = async () => {
    if (!currentUser) {
      onOpenAuth('Please sign in or register a free account to save your QR code.');
      return;
    }

    setSaving(true);
    try {
      const record = await saveQRCode({
        id: editingQR?.id,
        user_id: currentUser.id,
        name: qrName.trim() || (isLandingType ? landingData.title : `${selectedType.toUpperCase()} QR Code`),
        type: selectedType,
        mode: isLandingType ? 'editable' : 'static',
        slug: isLandingType ? currentSlug : undefined,
        destination_url: destinationUrl,
        landing_page: isLandingType ? landingData : undefined,
        content: {
          ...content,
          landingPage: isLandingType ? landingData : undefined,
          url: destinationUrl
        },
        design,
        is_active: true
      });

      setSavedSuccess(true);
      if (onQRSaved) {
        onQRSaved(record);
      }
    } catch (err: any) {
      console.error('Error saving QR code:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 font-noto">
      {/* Toast */}
      {savedSuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0a0909] text-white text-xs font-semibold shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
          <span>Landing Page & QR Code saved successfully!</span>
        </div>
      )}

      {/* STEP 1: CHOOSE YOUR QR CODE CONTENT (PIXEL PERFECT TO MYQRCODE.COM/GENERATOR) */}
      {step === 1 && (
        <div className="animate-in fade-in duration-200">
          {/* Main Title Section */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-[24px] font-bold font-rubik leading-[32px] text-[#0a0909]">
              Choose your QR code content
            </h1>
            <p className="text-[14px] leading-[22px] text-[#3f3e3e] mt-1.5 max-w-3xl">
              Select the material you'd like to share. Link web pages, PDFs, menus, videos, apps and more!
            </p>
          </div>

          {/* 12 Content Type Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {GENERATOR_CARDS.map((card) => {
              const Icon = card.icon;
              const isSelected = selectedType === card.type;

              return (
                <div
                  key={card.type}
                  onClick={() => handleSelectCard(card)}
                  className={`group relative flex flex-col justify-between p-5 bg-white rounded-[8px] border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-[#4981ff] ring-2 ring-[#4981ff]/20 shadow-[0px_1px_8px_0px_rgba(63,72,103,0.16)]'
                      : 'border-[#e3e5ed] hover:border-[#4981ff] shadow-[0px_1px_8px_0px_rgba(63,72,103,0.16)]'
                  }`}
                >
                  {/* Badge */}
                  {card.badge && (
                    <span className="absolute top-4 right-4 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#4981ff]/10 text-[#4981ff]">
                      {card.badge}
                    </span>
                  )}

                  <div>
                    {/* Card Icon */}
                    <div className="w-10 h-10 rounded-[8px] bg-[#f5f6fb] group-hover:bg-[#4981ff]/10 flex items-center justify-center text-[#4981ff] transition-colors mb-4">
                      <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>

                    {/* H4 Title */}
                    <h4 className="text-[18px] font-bold font-rubik leading-[26px] text-[#0a0909] group-hover:text-[#4981ff] transition-colors">
                      {card.title}
                    </h4>

                    {/* Body Text */}
                    <p className="text-[14px] leading-[22px] text-[#3f3e3e] mt-1 line-clamp-2">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f5f6fb] flex items-center justify-between text-xs text-[#4981ff] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>{card.isLandingType ? 'Create landing page & QR' : 'Create direct QR code'}</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2 & 3: SPECIALIZED DEDICATED URL QR CODE GENERATOR (MATCHING USER'S SCREENSHOT) */}
      {step >= 2 && selectedType === 'url' && !useLandingPage && (
        <div className="animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#e3e5ed]">
            <button
              type="button"
              onClick={() => {
                if (editingQR && onCancelEdit) {
                  onCancelEdit();
                } else {
                  setStep(1);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e3e5ed] text-xs font-semibold text-[#0a0909] hover:bg-gray-50 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Type</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-bold">
                Website URL
              </span>
            </div>
          </div>

          <UrlQRCodeEditor
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
            onQRSaved={onQRSaved}
            editingQR={editingQR}
            onCancelEdit={onCancelEdit}
            onSwitchToLanding={() => {
              setUseLandingPage(true);
              setPreviewTab('landing');
            }}
          />
        </div>
      )}

      {/* STEP 2 & 3: SPECIALIZED DEDICATED VCARD GENERATOR WITH TEMPLATES & LANDING PAGE */}
      {step >= 2 && selectedType === 'vcard' && (
        <div className="animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#e3e5ed]">
            <button
              type="button"
              onClick={() => {
                if (editingQR && onCancelEdit) {
                  onCancelEdit();
                } else {
                  setStep(1);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e3e5ed] text-xs font-semibold text-[#0a0909] hover:bg-gray-50 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Type</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-bold">
                vCard Business Card
              </span>
            </div>
          </div>

          <VCardQRCodeEditor
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
            onQRSaved={onQRSaved}
            editingQR={editingQR}
            onCancelEdit={onCancelEdit}
          />
        </div>
      )}

      {/* STEP 2 & 3: SPECIALIZED DEDICATED PDF GENERATOR WITH VIEWER LANDING PAGE */}
      {step >= 2 && selectedType === 'pdf' && (
        <div className="animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#e3e5ed]">
            <button
              type="button"
              onClick={() => {
                if (editingQR && onCancelEdit) {
                  onCancelEdit();
                } else {
                  setStep(1);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e3e5ed] text-xs font-semibold text-[#0a0909] hover:bg-gray-50 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Type</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600/10 text-red-600 text-xs font-bold">
                PDF Document QR
              </span>
            </div>
          </div>

          <PdfQRCodeEditor
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
            onQRSaved={onQRSaved}
            editingQR={editingQR}
            onCancelEdit={onCancelEdit}
          />
        </div>
      )}

      {/* STEP 2 & 3: OTHER TYPES OR MULTI-LINK LANDING PAGE BUILDER */}
      {step >= 2 && !(selectedType === 'url' && !useLandingPage) && selectedType !== 'vcard' && selectedType !== 'pdf' && (
        <div className="animate-in fade-in duration-200">
          {/* Top Breadcrumb / Back Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#e3e5ed]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (editingQR && onCancelEdit) {
                    onCancelEdit();
                  } else {
                    setStep(1);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e3e5ed] text-xs font-semibold text-[#0a0909] hover:bg-gray-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Type</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#4981ff]/10 text-[#4981ff] text-xs font-bold">
                  {GENERATOR_CARDS.find((c) => c.type === selectedType)?.title || selectedType}
                </span>
                <input
                  type="text"
                  value={qrName}
                  onChange={(e) => setQrName(e.target.value)}
                  placeholder="QR Code Name"
                  className="font-bold font-rubik text-base text-[#0a0909] bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#4981ff] outline-none px-1 py-0.5"
                />
              </div>
            </div>

            {/* Quick Steps Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  step === 2
                    ? 'bg-[#4981ff] text-white shadow-xs'
                    : 'bg-[#f5f6fb] text-[#3f3e3e] hover:bg-gray-200'
                }`}
              >
                {useLandingPage ? '1. Landing Page & Links' : '1. Configure Content'}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  step === 3
                    ? 'bg-[#4981ff] text-white shadow-xs'
                    : 'bg-[#f5f6fb] text-[#3f3e3e] hover:bg-gray-200'
                }`}
              >
                2. QR Design & Download
              </button>
            </div>
          </div>

          {/* Two-Column Responsive Split Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form / Editor */}
            <div className="lg:col-span-7 space-y-6">
              {step === 2 && (
                <div>
                  {/* Option toggle for URL or vCard (which can be either landing page or direct) */}
                  {(selectedType === 'url' || selectedType === 'vcard') && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 rounded-2xl border border-blue-100 mb-5">
                      <div>
                        <div className="text-xs font-bold text-[#0a0909] flex items-center gap-1.5">
                          {useLandingPage ? (
                            <Smartphone className="w-3.5 h-3.5 text-[#4981ff]" />
                          ) : (
                            <QrCode className="w-3.5 h-3.5 text-[#0a0909]" />
                          )}
                          <span>
                            {useLandingPage ? 'Mobile Landing Page Mode' : 'Direct Scannable QR Mode'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#3f3e3e] mt-0.5">
                          {useLandingPage
                            ? 'Creates an editable landing page with multiple links, custom layout theme, and branding.'
                            : 'Encodes directly into the QR code pattern with no intermediate landing page.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextMode = !useLandingPage;
                          setUseLandingPage(nextMode);
                          setPreviewTab(nextMode ? 'landing' : 'qr');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-blue-200 bg-white hover:bg-gray-50 text-xs font-bold text-[#0a0909] transition shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
                      >
                        {useLandingPage ? 'Switch to Direct QR' : 'Create Landing Page'}
                      </button>
                    </div>
                  )}

                  {/* ================= SECTION A: LANDING PAGE FLOW ================= */}
                  {useLandingPage ? (
                    <div className="space-y-6">
                      <div className="mb-4">
                        <h2 className="text-xl font-bold font-rubik text-[#0a0909]">
                          Edit Landing Page & Content
                        </h2>
                        <p className="text-xs sm:text-sm text-[#3f3e3e] mt-1">
                          Customize your landing page URL, add or remove links, and configure what visitors see when they scan your QR code.
                        </p>
                      </div>

                      {/* Prominent Landing Page Theme / Template Selector */}
                      <div className="bg-white rounded-2xl border border-[#e3e5ed] p-5 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                          <div>
                            <h3 className="font-bold font-rubik text-sm text-[#0a0909] flex items-center gap-2">
                              <Layers className="w-4 h-4 text-[#4981ff]" />
                              <span>Landing Page Layout Template</span>
                            </h3>
                            <p className="text-xs text-[#84868e] mt-0.5">
                              Select a design layout for your mobile landing page (updated live in the preview).
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-[#4981ff] bg-[#4981ff]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {(landingData.design?.layoutTemplate || 'minimal')} Layout
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* 1. Minimal */}
                          <button
                            type="button"
                            onClick={() => {
                              setLandingData((prev) => ({
                                ...prev,
                                design: {
                                  ...prev.design,
                                  layoutTemplate: 'minimal',
                                  buttonStyle: 'rounded'
                                }
                              }));
                            }}
                            className={`relative p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              (landingData.design?.layoutTemplate || 'minimal') === 'minimal'
                                ? 'border-[#4981ff] bg-[#4981ff]/5 shadow-xs ring-1 ring-[#4981ff]/30'
                                : 'border-[#e3e5ed] hover:border-gray-300 bg-white'
                            }`}
                          >
                            {(landingData.design?.layoutTemplate || 'minimal') === 'minimal' && (
                              <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#4981ff] text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mb-2.5 text-gray-700">
                              <Feather className="w-4 h-4" />
                            </div>
                            <div className="font-bold text-xs text-[#0a0909]">Minimal</div>
                            <div className="text-[11px] text-[#84868e] mt-1 leading-snug">
                              Clean & understated. Distraction-free typography, centered profile, and minimalist link rows.
                            </div>
                          </button>

                          {/* 2. Business */}
                          <button
                            type="button"
                            onClick={() => {
                              setLandingData((prev) => ({
                                ...prev,
                                design: {
                                  ...prev.design,
                                  layoutTemplate: 'business',
                                  buttonStyle: 'soft'
                                }
                              }));
                            }}
                            className={`relative p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              landingData.design?.layoutTemplate === 'business'
                                ? 'border-[#4981ff] bg-[#4981ff]/5 shadow-xs ring-1 ring-[#4981ff]/30'
                                : 'border-[#e3e5ed] hover:border-gray-300 bg-white'
                            }`}
                          >
                            {landingData.design?.layoutTemplate === 'business' && (
                              <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#4981ff] text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-2.5 text-[#4981ff]">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="font-bold text-xs text-[#0a0909]">Business</div>
                            <div className="text-[11px] text-[#84868e] mt-1 leading-snug">
                              Corporate cover banner, verified badge, and 1-tap contact card (Call, Email, WhatsApp, vCard).
                            </div>
                          </button>

                          {/* 3. Creative */}
                          <button
                            type="button"
                            onClick={() => {
                              setLandingData((prev) => ({
                                ...prev,
                                design: {
                                  ...prev.design,
                                  layoutTemplate: 'creative',
                                  buttonStyle: 'pill'
                                }
                              }));
                            }}
                            className={`relative p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              landingData.design?.layoutTemplate === 'creative'
                                ? 'border-[#4981ff] bg-[#4981ff]/5 shadow-xs ring-1 ring-[#4981ff]/30'
                                : 'border-[#e3e5ed] hover:border-gray-300 bg-white'
                            }`}
                          >
                            {landingData.design?.layoutTemplate === 'creative' && (
                              <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#4981ff] text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mb-2.5 text-purple-600">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="font-bold text-xs text-[#0a0909]">Creative</div>
                            <div className="text-[11px] text-[#84868e] mt-1 leading-snug">
                              Radiant ambient aura glow, star featured highlight badge, and vibrant creator social tiles.
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Landing Page Editor */}
                      <LandingPageEditor
                        data={landingData}
                        onChange={setLandingData}
                        accountEmail={currentUser?.email}
                      />

                      {/* Continue Button */}
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-[#84868e]">
                          Landing URL: <strong className="text-[#4981ff]">{destinationUrl}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-[#4981ff] hover:bg-[#386fe3] text-white text-sm font-bold rounded-xl shadow-sm transition active:scale-[0.98] cursor-pointer"
                        >
                          <span>Proceed to QR Design</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ================= SECTION B: DIRECT QR CODE CONTENT (NO LANDING PAGE) ================= */
                    <div className="space-y-6">
                      <div className="mb-4">
                        <h2 className="text-xl font-bold font-rubik text-[#0a0909]">
                          {selectedType === 'wifi'
                            ? 'Configure Wi-Fi Network'
                            : selectedType === 'text'
                            ? 'Enter Plain Text Content'
                            : selectedType === 'url'
                            ? 'Direct Website Destination'
                            : selectedType === 'vcard'
                            ? 'Electronic Business Card (vCard)'
                            : 'Configure QR Content'}
                        </h2>
                        <p className="text-xs sm:text-sm text-[#3f3e3e] mt-1">
                          This QR code encodes your data directly into the scannable pattern with no landing page.
                        </p>
                      </div>

                      {/* Wi-Fi Form */}
                      {selectedType === 'wifi' && (
                        <div className="bg-white rounded-2xl border border-[#e3e5ed] p-5 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                            <Wifi className="w-5 h-5 text-[#4981ff]" />
                            <h3 className="text-sm font-bold text-[#0a0909]">Wireless Network Credentials</h3>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0a0909] mb-1.5">
                              Network Name (SSID) *
                            </label>
                            <input
                              type="text"
                              value={content.ssid || ''}
                              onChange={(e) => setContent((prev) => ({ ...prev, ssid: e.target.value }))}
                              placeholder="e.g., Office-Guest-WiFi"
                              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] outline-none"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-[#0a0909]">
                                Password
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowWifiPassword(!showWifiPassword)}
                                className="flex items-center gap-1 text-[11px] text-[#84868e] hover:text-[#0a0909]"
                              >
                                {showWifiPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                <span>{showWifiPassword ? 'Hide' : 'Show'}</span>
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type={showWifiPassword ? 'text' : 'password'}
                                value={content.password || ''}
                                onChange={(e) => setContent((prev) => ({ ...prev, password: e.target.value }))}
                                placeholder="Enter Wi-Fi password (leave empty if open)"
                                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] outline-none pr-10"
                              />
                              <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div>
                              <label className="block text-xs font-bold text-[#0a0909] mb-1.5">
                                Network Encryption
                              </label>
                              <select
                                value={content.encryption || 'WPA'}
                                onChange={(e) => setContent((prev) => ({ ...prev, encryption: e.target.value }))}
                                className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] outline-none bg-white"
                              >
                                <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                                <option value="WEP">WEP</option>
                                <option value="nopass">None (Open Network)</option>
                              </select>
                            </div>

                            <div className="flex items-center sm:pt-6">
                              <label className="flex items-center gap-2 text-xs text-[#0a0909] font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(content.hidden)}
                                  onChange={(e) => setContent((prev) => ({ ...prev, hidden: e.target.checked }))}
                                  className="w-4 h-4 rounded text-[#4981ff]"
                                />
                                <span>Hidden Network (SSID not broadcasted)</span>
                              </label>
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-[#3f3e3e] flex items-start gap-2">
                            <Info className="w-4 h-4 text-[#4981ff] shrink-0 mt-0.5" />
                            <span>
                              When iOS or Android users scan this QR code, they are prompted to join{' '}
                              <strong>{content.ssid || 'your network'}</strong> automatically without manually typing the password.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Plain Text Form */}
                      {selectedType === 'text' && (
                        <div className="bg-white rounded-2xl border border-[#e3e5ed] p-5 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                            <AlignLeft className="w-5 h-5 text-[#4981ff]" />
                            <h3 className="text-sm font-bold text-[#0a0909]">Plain Text Message</h3>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-[#0a0909]">
                                Text Content *
                              </label>
                              <span className="text-[11px] text-[#84868e]">
                                {(content.text || '').length} characters
                              </span>
                            </div>
                            <textarea
                              rows={5}
                              value={content.text || ''}
                              onChange={(e) => setContent((prev) => ({ ...prev, text: e.target.value }))}
                              placeholder="Type your text or note here. When scanned, this text will appear immediately on the user's screen."
                              className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] outline-none"
                            />
                          </div>

                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#84868e] flex items-start gap-2">
                            <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                            <span>
                              Plain text barcodes do not require an active internet connection to read on any smartphone.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Direct Website URL Form */}
                      {selectedType === 'url' && (
                        <div className="bg-white rounded-2xl border border-[#e3e5ed] p-5 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                            <Globe className="w-5 h-5 text-[#4981ff]" />
                            <h3 className="text-sm font-bold text-[#0a0909]">Target Website Address</h3>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#0a0909] mb-1.5">
                              Destination URL *
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="url"
                                value={content.url || ''}
                                onChange={(e) => setContent((prev) => ({ ...prev, url: e.target.value }))}
                                placeholder="https://yourwebsite.com"
                                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] outline-none"
                              />
                              {content.url && (
                                <a
                                  href={content.url.startsWith('http') ? content.url : `https://${content.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2.5 rounded-xl border border-[#e3e5ed] hover:bg-gray-50 text-xs font-bold text-[#0a0909] transition shrink-0 flex items-center gap-1"
                                >
                                  <span>Test</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-[#3f3e3e] flex items-start gap-2">
                            <Info className="w-4 h-4 text-[#4981ff] shrink-0 mt-0.5" />
                            <span>
                              Direct scan mode bypasses landing pages completely. When scanned, camera apps will open this web address directly.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Direct vCard Form */}
                      {selectedType === 'vcard' && (
                        <div className="bg-white rounded-2xl border border-[#e3e5ed] p-5 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                            <Contact className="w-5 h-5 text-[#4981ff]" />
                            <h3 className="text-sm font-bold text-[#0a0909]">Direct Electronic Contact Card</h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-[#0a0909] mb-1.5">First Name</label>
                              <input
                                type="text"
                                value={content.firstName || ''}
                                onChange={(e) => setContent((prev) => ({ ...prev, firstName: e.target.value }))}
                                placeholder="Jane"
                                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-[#e3e5ed] outline-none focus:border-[#4981ff]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#0a0909] mb-1.5">Last Name</label>
                              <input
                                type="text"
                                value={content.lastName || ''}
                                onChange={(e) => setContent((prev) => ({ ...prev, lastName: e.target.value }))}
                                placeholder="Doe"
                                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-[#e3e5ed] outline-none focus:border-[#4981ff]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#0a0909] mb-1.5">Phone Number</label>
                              <input
                                type="tel"
                                value={content.phone || ''}
                                onChange={(e) => setContent((prev) => ({ ...prev, phone: e.target.value }))}
                                placeholder="+1 555-0199"
                                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-[#e3e5ed] outline-none focus:border-[#4981ff]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#0a0909] mb-1.5">Email Address</label>
                              <input
                                type="email"
                                value={content.email || ''}
                                onChange={(e) => setContent((prev) => ({ ...prev, email: e.target.value }))}
                                placeholder="jane@company.com"
                                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-[#e3e5ed] outline-none focus:border-[#4981ff]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#0a0909] mb-1.5">Organization / Company</label>
                              <input
                                type="text"
                                value={content.company || ''}
                                onChange={(e) => setContent((prev) => ({ ...prev, company: e.target.value }))}
                                placeholder="Acme Studio"
                                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-[#e3e5ed] outline-none focus:border-[#4981ff]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-[#0a0909] mb-1.5">Job Title</label>
                              <input
                                type="text"
                                value={content.jobTitle || ''}
                                onChange={(e) => setContent((prev) => ({ ...prev, jobTitle: e.target.value }))}
                                placeholder="Creative Director"
                                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-[#e3e5ed] outline-none focus:border-[#4981ff]"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Continue Button for Direct Mode */}
                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-[#84868e]">
                          QR Payload Ready: <strong className="text-[#0a0909]">{selectedType.toUpperCase()}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-[#4981ff] hover:bg-[#386fe3] text-white text-sm font-bold rounded-xl shadow-sm transition active:scale-[0.98] cursor-pointer"
                        >
                          <span>Proceed to QR Design</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold font-rubik text-[#0a0909]">
                      Customize QR Code Design
                    </h2>
                    <p className="text-xs sm:text-sm text-[#3f3e3e] mt-1">
                      Pick patterns, colors, gradients, and frames. The QR code points dynamically to your landing page.
                    </p>
                  </div>

                  {/* Pattern & Color Settings */}
                  <div className="bg-white rounded-2xl border border-[#e3e5ed] p-5 shadow-xs space-y-5">
                    {/* Template presets */}
                    <div>
                      <label className="block text-xs font-bold text-[#0a0909] mb-2">
                        Style Presets
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['minimal', 'bold', 'soft', 'tech', 'business', 'creative', 'gradient', 'mono'] as const).map(
                          (tpl) => (
                            <button
                              key={tpl}
                              type="button"
                              onClick={() => {
                                const preset = DESIGN_TEMPLATES[tpl];
                                if (preset) {
                                  setDesign((prev) => ({ ...prev, ...preset, template: tpl }));
                                }
                              }}
                              className={`py-2 px-2.5 rounded-lg border text-xs font-semibold capitalize transition ${
                                design.template === tpl
                                  ? 'border-[#4981ff] bg-[#4981ff]/10 text-[#4981ff]'
                                  : 'border-[#e3e5ed] text-[#3f3e3e] hover:border-gray-300'
                              }`}
                            >
                              {tpl}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Color controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-semibold text-[#0a0909] mb-1">
                          Foreground Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={design.foregroundColor}
                            onChange={(e) =>
                              setDesign((prev) => ({ ...prev, foregroundColor: e.target.value }))
                            }
                            className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={design.foregroundColor}
                            onChange={(e) =>
                              setDesign((prev) => ({ ...prev, foregroundColor: e.target.value }))
                            }
                            className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-[#e3e5ed]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#0a0909] mb-1">
                          Background Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={design.backgroundColor}
                            onChange={(e) =>
                              setDesign((prev) => ({ ...prev, backgroundColor: e.target.value }))
                            }
                            className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={design.backgroundColor}
                            onChange={(e) =>
                              setDesign((prev) => ({ ...prev, backgroundColor: e.target.value }))
                            }
                            className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-[#e3e5ed]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dot style */}
                    <div className="pt-2 border-t border-gray-100">
                      <label className="block text-xs font-bold text-[#0a0909] mb-2">
                        Pattern Dots
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['square', 'rounded', 'dots', 'extra-rounded'] as const).map((dot) => (
                          <button
                            key={dot}
                            type="button"
                            onClick={() => setDesign((prev) => ({ ...prev, dotStyle: dot }))}
                            className={`py-2 px-2 rounded-lg border text-xs font-semibold capitalize transition ${
                              design.dotStyle === dot
                                ? 'border-[#4981ff] bg-[#4981ff]/10 text-[#4981ff]'
                                : 'border-[#e3e5ed] text-[#3f3e3e]'
                            }`}
                          >
                            {dot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Save and Download Action Panel */}
                  <div className="bg-white rounded-2xl border border-[#e3e5ed] p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <div className="font-bold font-rubik text-sm text-[#0a0909]">
                        Ready to launch?
                      </div>
                      <div className="text-xs text-[#84868e] mt-0.5">
                        Save to your account and download your high-res print files.
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#4981ff] hover:bg-[#386fe3] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-[0.98] disabled:opacity-50"
                      >
                        {saving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>{currentUser ? 'Save to Account' : 'Sign in & Save'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload('png')}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0a0909] hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition"
                      >
                        <Download className="w-4 h-4" />
                        <span>PNG</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload('svg')}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-[#e3e5ed] hover:bg-gray-50 text-xs font-bold text-[#0a0909] rounded-xl transition"
                      >
                        <span>SVG</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Interactive Phone Mockup & QR Code Live Preview */}
            <div className="lg:col-span-5 sticky top-24 space-y-4">
              {useLandingPage ? (
                /* Preview Mode Switcher when Landing Page is active */
                <div className="flex items-center justify-between p-1.5 bg-white border border-[#e3e5ed] rounded-2xl shadow-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('landing')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      previewTab === 'landing'
                        ? 'bg-[#4981ff] text-white shadow-xs'
                        : 'text-[#84868e] hover:text-[#0a0909]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Landing Page Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewTab('qr')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      previewTab === 'qr'
                        ? 'bg-[#4981ff] text-white shadow-xs'
                        : 'text-[#84868e] hover:text-[#0a0909]'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR Code Preview</span>
                  </button>
                </div>
              ) : (
                /* Direct QR Indicator when no landing page is needed */
                <div className="p-3 bg-white border border-[#e3e5ed] rounded-2xl shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0a0909]">
                    <QrCode className="w-4 h-4 text-[#4981ff]" />
                    <span>Live Scannable QR Code</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    Direct Scan (No Landing Page)
                  </span>
                </div>
              )}

              {/* View 1: Smartphone Live Landing Page Preview (only when useLandingPage && previewTab === 'landing') */}
              {useLandingPage && previewTab === 'landing' && (
                <div className="bg-white rounded-3xl border border-[#e3e5ed] p-4 shadow-sm text-center">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#84868e]">
                      Live Mobile Mockup
                    </span>
                    <a
                      href={`/${currentSlug || 'qr'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#4981ff] font-semibold hover:underline"
                    >
                      <span>Full Window</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Render Mockup */}
                  <PhoneMockupPreview data={landingData} />

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#84868e]">
                    <span className="font-mono text-[11px] truncate max-w-[200px]">
                      {destinationUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(destinationUrl);
                          setCopiedUrl(true);
                          setTimeout(() => setCopiedUrl(false), 2000);
                        }
                      }}
                      className="text-[#4981ff] font-bold hover:underline"
                    >
                      {copiedUrl ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* View 2: QR Code Live Preview (when !useLandingPage OR previewTab === 'qr') */}
              {(!useLandingPage || previewTab === 'qr') && (
                <div className="bg-white rounded-3xl border border-[#e3e5ed] p-6 shadow-sm text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#84868e] block mb-4">
                    Live Scannable QR Code
                  </span>

                  <div className="inline-block p-4 rounded-2xl bg-white border border-[#e3e5ed] shadow-md">
                    <canvas ref={canvasRef} className="w-[240px] h-[240px] rounded-lg" />
                  </div>

                  <div className="mt-4 text-xs font-mono text-[#84868e] truncate max-w-xs mx-auto">
                    {destinationUrl}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => handleDownload('png')}
                      className="py-2 rounded-xl bg-[#4981ff] hover:bg-[#386fe3] text-white text-xs font-bold transition shadow-xs"
                    >
                      PNG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload('svg')}
                      className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0a0909] text-xs font-bold transition"
                    >
                      SVG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload('pdf')}
                      className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0a0909] text-xs font-bold transition"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
