import React, { useState, useEffect, useRef } from 'react';
import {
  QRCodeRecord,
  QRCodeDesign,
  UserProfile,
  FrameStyle,
  DotStyle,
  CornerSquareStyle,
  LandingPageData,
  VCardConnectIcon,
  VCardContactItem,
  VCardSocialItem
} from '../../types';
import {
  renderQRToCanvas,
  generateQRSVG,
  formatQRContent,
  DESIGN_TEMPLATES
} from '../../lib/qr/generator';
import { saveQRCode } from '../../lib/storage';
import { getSiteUrl, getLandingPageUrl } from '../../lib/config';
import {
  Contact,
  Minus,
  Plus,
  ChevronRight,
  HelpCircle,
  Download,
  Copy,
  Check,
  Palette,
  Sparkles,
  Upload,
  RefreshCw,
  ExternalLink,
  Layers,
  ShieldCheck,
  Smartphone,
  Trash2,
  GripVertical,
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  MapPin,
  Globe,
  Share2,
  QrCode,
  Image as ImageIcon,
  Grid,
  List,
  CheckCircle2,
  Briefcase,
  ChevronLeft,
  X
} from 'lucide-react';

interface VCardQRCodeEditorProps {
  currentUser: UserProfile | null;
  onOpenAuth: (prompt?: string) => void;
  onQRSaved?: (qr: QRCodeRecord) => void;
  editingQR?: QRCodeRecord | null;
  onCancelEdit?: () => void;
}

export type VCardTemplateType =
  | 'hero-portrait'
  | 'modern-card'
  | 'navy-wave'
  | 'textured-craft'
  | 'corporate-blue'
  | 'warm-split';

interface TemplateOption {
  id: VCardTemplateType;
  title: string;
  subtitle: string;
  thumbnail: string;
  badge?: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'hero-portrait',
    title: 'Hero Portrait',
    subtitle: 'John Richards',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    badge: 'Popular'
  },
  {
    id: 'modern-card',
    title: 'Modern Card',
    subtitle: 'Leslie Murphy',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    badge: 'Executive'
  },
  {
    id: 'navy-wave',
    title: 'Navy Wave',
    subtitle: 'Property Advisor',
    thumbnail: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    badge: 'Creative'
  },
  {
    id: 'textured-craft',
    title: 'Textured Craft',
    subtitle: 'Fashion Designer',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    badge: 'Minimal'
  },
  {
    id: 'corporate-blue',
    title: 'Corporate Blue',
    subtitle: 'Financial Manager',
    thumbnail: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
    badge: 'Corporate'
  },
  {
    id: 'warm-split',
    title: 'Warm Split',
    subtitle: 'Portrait Artist',
    thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    badge: 'Modern'
  }
];

export const VCardQRCodeEditor: React.FC<VCardQRCodeEditorProps> = ({
  currentUser,
  onOpenAuth,
  onQRSaved,
  editingQR = null,
  onCancelEdit
}) => {
  // 1. Template State
  const [selectedTemplate, setSelectedTemplate] = useState<VCardTemplateType>(() => {
    return (editingQR?.landing_page?.vcardTemplate as VCardTemplateType) || 'hero-portrait';
  });

  // 2. Profile States
  const [showProfilePhoto, setShowProfilePhoto] = useState(true);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80'
  );

  const [showBrandLogo, setShowBrandLogo] = useState(true);
  const [brandLogoText, setBrandLogoText] = useState('Teamwork.Co');
  const [brandLogoLetter, setBrandLogoLetter] = useState('T');

  const [name, setName] = useState(editingQR?.landing_page?.title || 'John Richards');
  const [heading, setHeading] = useState(editingQR?.landing_page?.jobTitle || 'Marketing Manager');
  const [subHeading, setSubHeading] = useState(editingQR?.landing_page?.company || 'Teamwork.Co');

  // Profile Connect Icons
  const [showConnectIcons, setShowConnectIcons] = useState(true);
  const [connectIcons, setConnectIcons] = useState<VCardConnectIcon[]>([
    { id: 'ci_1', type: 'mobile', value: '+1 (555) 234-5678' },
    { id: 'ci_2', type: 'email', value: 'john.richards@teamwork.co' },
    { id: 'ci_3', type: 'sms', value: '+1 (555) 234-5678' },
    { id: 'ci_4', type: 'whatsapp', value: '+15552345678' }
  ]);

  // Heading + Text Block
  const [showHeadingText, setShowHeadingText] = useState(true);
  const [headingTextTitle, setHeadingTextTitle] = useState('About Me');
  const [headingTextDesc, setHeadingTextDesc] = useState(
    'Passionate marketing strategist and brand developer helping growth-stage ventures build meaningful customer relationships across digital touchpoints.'
  );
  const [headingCardBg, setHeadingCardBg] = useState(true);

  // Contact Us Block
  const [showContactUs, setShowContactUs] = useState(true);
  const [contactUsTitle, setContactUsTitle] = useState('Contact Us');
  const [contactIconEnabled, setContactIconEnabled] = useState(true);
  const [autoSaveContact, setAutoSaveContact] = useState(false);
  const [contactExchangeForm, setContactExchangeForm] = useState(true);

  const [contactNumbers, setContactNumbers] = useState<VCardContactItem[]>([
    { id: 'cn_1', type: 'phone', label: 'Call Us', value: '123 456 7890' }
  ]);
  const [contactEmails, setContactEmails] = useState<VCardContactItem[]>([
    { id: 'ce_1', type: 'email', label: 'Email', value: 'contactme@domain.com' }
  ]);
  const [addressLine1, setAddressLine1] = useState('100 Market Street');
  const [addressLine2, setAddressLine2] = useState('Suite 400');
  const [city, setCity] = useState('San Francisco');
  const [state, setState] = useState('CA');
  const [country, setCountry] = useState('United States');
  const [zipcode, setZipcode] = useState('94105');
  const [addressActionBtn, setAddressActionBtn] = useState(true);
  const [addressMapUrl, setAddressMapUrl] = useState('https://maps.google.com');

  // Images Block
  const [showImagesSection, setShowImagesSection] = useState(true);
  const [showImagesTitleDesc, setShowImagesTitleDesc] = useState(false);
  const [imagesTitle, setImagesTitle] = useState('Portfolio Showcase');
  const [imagesDesc, setImagesDesc] = useState('Recent featured projects and collaborations');
  const [imagesViewType, setImagesViewType] = useState<'list' | 'grid1' | 'grid2'>('list');
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80'
  ]);
  const [imagesCardBg, setImagesCardBg] = useState(true);

  // Social Links Block
  const [showSocialSection, setShowSocialSection] = useState(true);
  const [showSocialTitleDesc, setShowSocialTitleDesc] = useState(true);
  const [socialTitle, setSocialTitle] = useState('Social Links');
  const [socialDesc, setSocialDesc] = useState('Connect with me across official channels');
  const [socialItems, setSocialItems] = useState<VCardSocialItem[]>([
    {
      id: 'soc_1',
      platform: 'Facebook',
      url: 'https://facebook.com',
      title: 'Facebook',
      subtitle: 'Follow us on Facebook',
      showSubtitle: true
    },
    {
      id: 'soc_2',
      platform: 'Instagram',
      url: 'https://instagram.com',
      title: 'Instagram',
      subtitle: 'Follow us on Instagram',
      showSubtitle: false
    }
  ]);

  // Section Accordion collapse toggles
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    profile: false,
    headingText: false,
    contactUs: false,
    images: false,
    social: false,
    qrDesign: true
  });

  const toggleCollapse = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // QR Code Design State
  const [design, setDesign] = useState<QRCodeDesign>(() => {
    if (editingQR?.design) return editingQR.design;
    return {
      dotStyle: 'rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
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
        padding: 6,
        shape: 'circle'
      },
      frame: {
        style: 'none',
        label: 'SCAN ME',
        color: '#0a0909',
        textColor: '#ffffff'
      },
      margin: 3,
      errorCorrectionLevel: 'M'
    };
  });

  const [qrName, setQrName] = useState(editingQR?.name || 'vCard QR Code');
  const [slug, setSlug] = useState(
    editingQR?.slug || `vcard-${Date.now().toString(36)}`
  );

  // Status & modal states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeQuickTab, setActiveQuickTab] = useState<'STICKER' | 'COLOR' | 'SHAPES' | 'LOGO'>('STICKER');
  const [showQRModal, setShowQRModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const brandLogoInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Target landing page URL
  const publicPageUrl = getLandingPageUrl(slug);

  // Render QR Canvas whenever design or slug changes
  useEffect(() => {
    const formatted = formatQRContent('url', { url: publicPageUrl });
    if (canvasRef.current) {
      renderQRToCanvas(canvasRef.current, formatted, design, 240);
    }
    if (showQRModal && modalCanvasRef.current) {
      renderQRToCanvas(modalCanvasRef.current, formatted, design, 300);
    }
  }, [design, publicPageUrl, showQRModal]);

  // Handle Download .vcf
  const handleDownloadVCard = () => {
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'Contact';
    const lastName = nameParts.slice(1).join(' ') || '';

    const primaryPhone =
      connectIcons.find((ci) => ci.type === 'mobile' || ci.type === 'phone')?.value ||
      contactNumbers[0]?.value ||
      '';
    const primaryEmail =
      connectIcons.find((ci) => ci.type === 'email')?.value ||
      contactEmails[0]?.value ||
      '';

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName};${firstName};;;`,
      `FN:${name}`,
      heading ? `TITLE:${heading}` : '',
      subHeading ? `ORG:${subHeading}` : '',
      primaryPhone ? `TEL;TYPE=CELL:${primaryPhone}` : '',
      primaryEmail ? `EMAIL:${primaryEmail}` : '',
      publicPageUrl ? `URL:${publicPageUrl}` : '',
      city ? `ADR:;;${addressLine1};${city};${state};${zipcode};${country}` : '',
      `NOTE:${headingTextDesc || 'Digital business card'}`,
      'END:VCARD'
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, '-') || 'contact'}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle Save QR code
  const handleSaveQR = () => {
    if (!currentUser) {
      onOpenAuth('Please sign in to save your custom vCard QR code.');
      return;
    }

    setIsSaving(true);
    try {
      const landingData: LandingPageData = {
        slug,
        title: name,
        bio: headingTextDesc,
        jobTitle: heading,
        company: subHeading,
        brandLogo: brandLogoText,
        avatarUrl: profilePhotoUrl,
        coverUrl: profilePhotoUrl,
        badge: 'Official vCard',
        vcardTemplate: selectedTemplate,
        showProfilePhoto,
        showBrandLogo,
        showConnectIcons,
        connectIcons,
        headingTextSection: {
          enabled: showHeadingText,
          title: headingTextTitle,
          description: headingTextDesc,
          showCardBg: headingCardBg
        },
        contactSection: {
          enabled: showContactUs,
          title: contactUsTitle,
          showIcon: contactIconEnabled,
          autoSaveContact,
          contactExchangeForm,
          items: [...contactNumbers, ...contactEmails]
        },
        imagesSection: {
          enabled: showImagesSection,
          showTitleDesc: showImagesTitleDesc,
          title: imagesTitle,
          description: imagesDesc,
          viewType: imagesViewType,
          photos,
          showCardBg: imagesCardBg
        },
        socialSection: {
          enabled: showSocialSection,
          showTitleDesc: showSocialTitleDesc,
          title: socialTitle,
          description: socialDesc,
          items: socialItems
        },
        links: [
          {
            id: 'lnk_vcf',
            title: 'Save Contact to Phone',
            url: '#save-vcard',
            description: 'Download .vcf contact card directly',
            icon: 'contact',
            isActive: true
          }
        ],
        socials: socialItems.map((s) => ({
          platform: s.platform.toLowerCase(),
          url: s.url
        })),
        contact: {
          email: contactEmails[0]?.value || '',
          phone: contactNumbers[0]?.value || '',
          location: city ? `${city}, ${country}` : ''
        },
        design: {
          theme: 'modern-blue',
          buttonStyle: 'rounded',
          buttonVariant: 'filled',
          primaryColor: '#4981ff',
          backgroundColor: '#ffffff',
          textColor: '#0a0909',
          fontFamily: 'Rubik',
          avatarShape: 'rounded',
          layoutTemplate: selectedTemplate
        }
      };

      const saved = saveQRCode({
        id: editingQR?.id,
        user_id: currentUser.id,
        name: qrName || `${name} vCard`,
        type: 'vcard',
        mode: 'editable',
        slug,
        destination_url: publicPageUrl,
        landing_page: landingData,
        content: {
          firstName: name.split(' ')[0] || '',
          lastName: name.split(' ').slice(1).join(' ') || '',
          company: subHeading,
          jobTitle: heading,
          phone: connectIcons.find((c) => c.type === 'mobile')?.value || '',
          email: connectIcons.find((c) => c.type === 'email')?.value || '',
          website: publicPageUrl,
          street: addressLine1,
          city,
          state,
          zip: zipcode,
          country
        },
        design,
        is_active: true
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);

      if (onQRSaved) {
        onQRSaved(saved);
      }
    } catch (err) {
      console.error('Error saving vCard QR:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Profile Connect Icons helpers
  const handleAddConnectIcon = () => {
    const newId = `ci_${Date.now()}`;
    setConnectIcons((prev) => [
      ...prev,
      { id: newId, type: 'mobile', value: '' }
    ]);
  };

  const handleRemoveConnectIcon = (id: string) => {
    setConnectIcons((prev) => prev.filter((ci) => ci.id !== id));
  };

  const handleConnectIconChange = (id: string, field: 'type' | 'value', val: string) => {
    setConnectIcons((prev) =>
      prev.map((ci) => (ci.id === id ? { ...ci, [field]: val } : ci))
    );
  };

  // Contact items helpers
  const handleAddContactNumber = () => {
    setContactNumbers((prev) => [
      ...prev,
      { id: `cn_${Date.now()}`, type: 'phone', label: 'Call Us', value: '' }
    ]);
  };

  const handleAddContactEmail = () => {
    setContactEmails((prev) => [
      ...prev,
      { id: `ce_${Date.now()}`, type: 'email', label: 'Email', value: '' }
    ]);
  };

  // Social items helpers
  const handleAddSocialItem = () => {
    setSocialItems((prev) => [
      ...prev,
      {
        id: `soc_${Date.now()}`,
        platform: 'LinkedIn',
        url: 'https://linkedin.com',
        title: 'LinkedIn',
        subtitle: 'Connect on LinkedIn',
        showSubtitle: true
      }
    ]);
  };

  const handleRemoveSocialItem = (id: string) => {
    setSocialItems((prev) => prev.filter((s) => s.id !== id));
  };

  // Upload image handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'brand' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (target === 'profile') setProfilePhotoUrl(result);
      if (target === 'brand') setBrandLogoLetter(result);
      if (target === 'gallery') setPhotos((prev) => [...prev, result]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. TOP CAROUSEL: PAGE TEMPLATE */}
      <div className="bg-white rounded-2xl border border-[#e3e5ed] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold font-rubik text-[#0a0909] flex items-center gap-2">
              <span>Page Template</span>
              <span className="text-xs font-normal text-[#84868e]">
                (Click on the template you like)
              </span>
            </h2>
          </div>
          <span className="text-[11px] font-bold text-[#4981ff] bg-[#4981ff]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {TEMPLATE_OPTIONS.find((t) => t.id === selectedTemplate)?.title}
          </span>
        </div>

        {/* Carousel Row */}
        <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-none">
          {TEMPLATE_OPTIONS.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`relative shrink-0 w-[110px] sm:w-[130px] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer text-left group shadow-xs ${
                  isSelected
                    ? 'border-[#4981ff] ring-2 ring-[#4981ff]/30 shadow-md scale-[1.02]'
                    : 'border-[#e3e5ed] hover:border-gray-400 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Template Mock Card */}
                <div className="relative h-[155px] bg-[#141416] overflow-hidden flex flex-col justify-between p-2">
                  {/* Background Mock */}
                  <img
                    src={tmpl.thumbnail}
                    alt={tmpl.title}
                    className={`absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 ${
                      tmpl.id === 'hero-portrait' ? 'filter grayscale contrast-125' : ''
                    }`}
                  />
                  {/* Subtle Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                  {/* Top Brand Logo / Accent */}
                  <div className="relative z-10 flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-[#f59e0b] flex items-center justify-center text-black font-black text-[9px] shadow-xs">
                      T
                    </div>
                    <span className="text-[8px] font-bold text-white tracking-tight truncate">
                      Teamwork.Co
                    </span>
                  </div>

                  {/* Active Selected Checkmark Badge */}
                  {isSelected && (
                    <div className="absolute bottom-2 left-2 z-20 w-5 h-5 rounded-full bg-[#4981ff] text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Mini Bottom Preview elements */}
                  <div className="relative z-10 text-right">
                    <span className="text-[9px] font-bold text-white block drop-shadow-sm truncate">
                      {tmpl.subtitle}
                    </span>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="w-3 h-3 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center text-[7px] text-white">
                        <Phone className="w-2 h-2" />
                      </span>
                      <span className="w-3 h-3 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center text-[7px] text-white">
                        <Mail className="w-2 h-2" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-white text-center border-t border-gray-100">
                  <span className={`text-[11px] font-bold block truncate ${isSelected ? 'text-[#4981ff]' : 'text-[#0a0909]'}`}>
                    {tmpl.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SPLIT WORKSPACE: LEFT FORM BLOCKS & RIGHT LIVE PHONE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN: ACCORDION BLOCKS ================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* SECTION A: PROFILE */}
          <div className="bg-white rounded-2xl border border-[#e3e5ed] overflow-hidden shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#f5f7fc] border-b border-[#e3e5ed]">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-[#84868e] cursor-grab" />
                <h3 className="font-bold font-rubik text-sm text-[#0a0909]">Profile</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle on/off */}
                <button
                  type="button"
                  onClick={() => setShowProfilePhoto(!showProfilePhoto)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    showProfilePhoto ? 'bg-[#3b82f6]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      showProfilePhoto ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                {/* Collapse button */}
                <button
                  type="button"
                  onClick={() => toggleCollapse('profile')}
                  className="w-6 h-6 rounded-full bg-white border border-[#e3e5ed] flex items-center justify-center text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  {collapsedSections.profile ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Profile Content */}
            {!collapsedSections.profile && (
              <div className="p-4 sm:p-5 space-y-5">
                {/* Profile Photo & Brand Logo Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Profile Photo */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#0a0909]">Profile Photo</span>
                      <button
                        type="button"
                        onClick={() => setShowProfilePhoto(!showProfilePhoto)}
                        className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                          showProfilePhoto ? 'bg-[#3b82f6]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                            showProfilePhoto ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-16 rounded-lg overflow-hidden border border-[#e3e5ed] bg-gray-100 shrink-0">
                        <img
                          src={profilePhotoUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'profile')}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-14 h-16 rounded-lg border border-dashed border-gray-300 hover:border-[#4981ff] bg-gray-50 flex flex-col items-center justify-center text-gray-500 hover:text-[#4981ff] transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[11px] text-[#84868e] mt-1 block">(500x625px, 4:5)</span>
                  </div>

                  {/* Brand Logo */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#0a0909]">Brand Logo</span>
                      <button
                        type="button"
                        onClick={() => setShowBrandLogo(!showBrandLogo)}
                        className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                          showBrandLogo ? 'bg-[#3b82f6]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                            showBrandLogo ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg border border-[#e3e5ed] bg-gray-50 flex items-center justify-center shrink-0">
                        <div className="w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center text-black font-black text-sm shadow-xs">
                          {brandLogoLetter}
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={brandLogoInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'brand')}
                      />
                      <button
                        type="button"
                        onClick={() => brandLogoInputRef.current?.click()}
                        className="w-16 h-16 rounded-lg border border-dashed border-gray-300 hover:border-[#4981ff] bg-gray-50 flex flex-col items-center justify-center text-gray-500 hover:text-[#4981ff] transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[11px] text-[#84868e] mt-1 block">(160x80px, 3:1)</span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#0a0909] mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] focus:ring-1 focus:ring-[#4981ff] text-sm text-[#0a0909] outline-none transition"
                  />
                </div>

                {/* Heading & Sub Heading */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0a0909] mb-1.5">
                      Heading
                    </label>
                    <input
                      type="text"
                      value={heading}
                      onChange={(e) => setHeading(e.target.value)}
                      placeholder="Title (e.g. Marketing Manager)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] focus:ring-1 focus:ring-[#4981ff] text-sm text-[#0a0909] outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0a0909] mb-1.5">
                      Sub Heading
                    </label>
                    <input
                      type="text"
                      value={subHeading}
                      onChange={(e) => setSubHeading(e.target.value)}
                      placeholder="Company (e.g. Teamwork.Co)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] focus:ring-1 focus:ring-[#4981ff] text-sm text-[#0a0909] outline-none transition"
                    />
                  </div>
                </div>

                {/* Profile Connect Icons (Image 2) */}
                <div className="pt-3 border-t border-[#e3e5ed]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#0a0909]">Profile Connect Icons</span>
                    <button
                      type="button"
                      onClick={() => setShowConnectIcons(!showConnectIcons)}
                      className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                        showConnectIcons ? 'bg-[#3b82f6]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                          showConnectIcons ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {showConnectIcons && (
                    <div className="space-y-3">
                      {connectIcons.map((ci) => (
                        <div
                          key={ci.id}
                          className="flex items-center gap-2 p-3 bg-[#f5f7fc] rounded-xl border border-[#e3e5ed]"
                        >
                          <select
                            value={ci.type}
                            onChange={(e) => handleConnectIconChange(ci.id, 'type', e.target.value)}
                            className="bg-white border border-[#e3e5ed] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0a0909] outline-none cursor-pointer"
                          >
                            <option value="mobile">Mobile</option>
                            <option value="email">Email</option>
                            <option value="sms">SMS</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="phone">Phone</option>
                            <option value="website">Website</option>
                          </select>

                          <input
                            type="text"
                            value={ci.value}
                            onChange={(e) => handleConnectIconChange(ci.id, 'value', e.target.value)}
                            placeholder={ci.type === 'email' ? 'youremail@domain.com' : '0000000000'}
                            className="flex-1 bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none focus:border-[#4981ff]"
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveConnectIcon(ci.id)}
                            className="w-7 h-7 rounded-full bg-white border border-gray-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition cursor-pointer"
                            title="Delete icon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddConnectIcon}
                        className="px-3.5 py-1.5 rounded-lg border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add More</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION B: HEADING + TEXT (Image 3) */}
          <div className="bg-white rounded-2xl border border-[#e3e5ed] overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-4 py-3 bg-[#f5f7fc] border-b border-[#e3e5ed]">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-[#84868e] cursor-grab" />
                <h3 className="font-bold font-rubik text-sm text-[#0a0909]">Heading + Text</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHeadingText(false)}
                  className="w-6 h-6 rounded-full bg-white border border-gray-200 text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowHeadingText(!showHeadingText)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    showHeadingText ? 'bg-[#3b82f6]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      showHeadingText ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => toggleCollapse('headingText')}
                  className="w-6 h-6 rounded-full bg-white border border-[#e3e5ed] flex items-center justify-center text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  {collapsedSections.headingText ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {!collapsedSections.headingText && showHeadingText && (
              <div className="p-4 sm:p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0a0909] mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={headingTextTitle}
                    onChange={(e) => setHeadingTextTitle(e.target.value)}
                    placeholder="About Me"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] text-sm text-[#0a0909] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0a0909] mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={headingTextDesc}
                    onChange={(e) => setHeadingTextDesc(e.target.value)}
                    placeholder="Description"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] text-sm text-[#0a0909] outline-none resize-y"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setHeadingCardBg(!headingCardBg)}
                    className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                      headingCardBg ? 'bg-[#3b82f6]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                        headingCardBg ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-medium text-[#84868e]">Card Background</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION C: CONTACT US (Image 3 & 4) */}
          <div className="bg-white rounded-2xl border border-[#e3e5ed] overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-4 py-3 bg-[#f5f7fc] border-b border-[#e3e5ed]">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-[#84868e] cursor-grab" />
                <h3 className="font-bold font-rubik text-sm text-[#0a0909]">Contact Us</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowContactUs(!showContactUs)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    showContactUs ? 'bg-[#3b82f6]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      showContactUs ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => toggleCollapse('contactUs')}
                  className="w-6 h-6 rounded-full bg-white border border-[#e3e5ed] flex items-center justify-center text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  {collapsedSections.contactUs ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {!collapsedSections.contactUs && showContactUs && (
              <div className="p-4 sm:p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0a0909] mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={contactUsTitle}
                    onChange={(e) => setContactUsTitle(e.target.value)}
                    placeholder="Contact Us"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] text-sm text-[#0a0909] outline-none"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-[#0a0909]">Contact Icon</span>
                      <button
                        type="button"
                        onClick={() => setContactIconEnabled(!contactIconEnabled)}
                        className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                          contactIconEnabled ? 'bg-[#3b82f6]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                            contactIconEnabled ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div className="w-12 h-12 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50 hover:text-[#4981ff] cursor-pointer">
                        <Upload className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto Save Contact & Contact Exchange Toggles */}
                <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#0a0909]">Auto-Save Contact</span>
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setAutoSaveContact(!autoSaveContact)}
                      className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                        autoSaveContact ? 'bg-[#3b82f6]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                          autoSaveContact ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#0a0909]">Contact Exchange Form</span>
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setContactExchangeForm(!contactExchangeForm)}
                      className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                        contactExchangeForm ? 'bg-[#3b82f6]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                          contactExchangeForm ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase">
                      New
                    </span>
                  </div>
                </div>

                {/* Contact Number Card */}
                {contactNumbers.map((cn) => (
                  <div key={cn.id} className="p-3.5 bg-[#f5f7fc] rounded-xl border border-[#e3e5ed] space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0a0909]">Contact Number</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setContactNumbers((prev) => prev.filter((p) => p.id !== cn.id))}
                          className="w-6 h-6 rounded-full bg-white border border-gray-200 text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Label</label>
                        <input
                          type="text"
                          value={cn.label}
                          onChange={(e) =>
                            setContactNumbers((prev) =>
                              prev.map((p) => (p.id === cn.id ? { ...p, label: e.target.value } : p))
                            )
                          }
                          className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Number</label>
                        <input
                          type="text"
                          value={cn.value}
                          onChange={(e) =>
                            setContactNumbers((prev) =>
                              prev.map((p) => (p.id === cn.id ? { ...p, value: e.target.value } : p))
                            )
                          }
                          className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Email Card */}
                {contactEmails.map((ce) => (
                  <div key={ce.id} className="p-3.5 bg-[#f5f7fc] rounded-xl border border-[#e3e5ed] space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0a0909]">Email</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setContactEmails((prev) => prev.filter((p) => p.id !== ce.id))}
                          className="w-6 h-6 rounded-full bg-white border border-gray-200 text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Label</label>
                        <input
                          type="text"
                          value={ce.label}
                          onChange={(e) =>
                            setContactEmails((prev) =>
                              prev.map((p) => (p.id === ce.id ? { ...p, label: e.target.value } : p))
                            )
                          }
                          className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Email</label>
                        <input
                          type="text"
                          value={ce.value}
                          onChange={(e) =>
                            setContactEmails((prev) =>
                              prev.map((p) => (p.id === ce.id ? { ...p, value: e.target.value } : p))
                            )
                          }
                          className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Address Card */}
                <div className="p-3.5 bg-[#f5f7fc] rounded-xl border border-[#e3e5ed] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0a0909]">Address</span>
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">Label</label>
                    <input
                      type="text"
                      value="Address"
                      readOnly
                      className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Address Line 1</label>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        placeholder="Street"
                        className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Address Line 2</label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="Suite / Apt"
                        className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="Country"
                        className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Zipcode</label>
                      <input
                        type="text"
                        value={zipcode}
                        onChange={(e) => setZipcode(e.target.value)}
                        placeholder="Zipcode"
                        className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-[11px] text-gray-500">Action Button</label>
                        <button
                          type="button"
                          onClick={() => setAddressActionBtn(!addressActionBtn)}
                          className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                            addressActionBtn ? 'bg-[#3b82f6]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                              addressActionBtn ? 'translate-x-3' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <input
                        type="text"
                        value="Direction"
                        readOnly
                        className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Google Map URL</label>
                      <input
                        type="text"
                        value={addressMapUrl}
                        onChange={(e) => setAddressMapUrl(e.target.value)}
                        placeholder="Google Map URL"
                        className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddContactNumber}
                    className="px-3.5 py-1.5 rounded-lg border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Phone</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddContactEmail}
                    className="px-3.5 py-1.5 rounded-lg border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Email</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION D: IMAGES (Image 5) */}
          <div className="bg-white rounded-2xl border border-[#e3e5ed] overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-4 py-3 bg-[#f5f7fc] border-b border-[#e3e5ed]">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-[#84868e] cursor-grab" />
                <h3 className="font-bold font-rubik text-sm text-[#0a0909]">Images</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImagesSection(!showImagesSection)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    showImagesSection ? 'bg-[#3b82f6]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      showImagesSection ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => toggleCollapse('images')}
                  className="w-6 h-6 rounded-full bg-white border border-[#e3e5ed] flex items-center justify-center text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  {collapsedSections.images ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {!collapsedSections.images && showImagesSection && (
              <div className="p-4 sm:p-5 space-y-4">
                {/* Title Description Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#0a0909]">Title, Description</span>
                  <button
                    type="button"
                    onClick={() => setShowImagesTitleDesc(!showImagesTitleDesc)}
                    className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                      showImagesTitleDesc ? 'bg-[#3b82f6]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                        showImagesTitleDesc ? 'translate-x-3' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {showImagesTitleDesc && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={imagesTitle}
                      onChange={(e) => setImagesTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#e3e5ed] text-xs outline-none"
                    />
                    <textarea
                      rows={2}
                      value={imagesDesc}
                      onChange={(e) => setImagesDesc(e.target.value)}
                      placeholder="Description"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#e3e5ed] text-xs outline-none"
                    />
                  </div>
                )}

                {/* View Type selector (List, Grid 1, Grid 2) */}
                <div>
                  <span className="text-xs font-semibold text-[#0a0909] block mb-2">View Type</span>
                  <div className="grid grid-cols-3 gap-3">
                    {/* List */}
                    <button
                      type="button"
                      onClick={() => setImagesViewType('list')}
                      className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                        imagesViewType === 'list'
                          ? 'border-[#3b82f6] bg-[#3b82f6]/5 ring-1 ring-[#3b82f6]'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {imagesViewType === 'list' && (
                        <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                      <div className="w-8 h-6 flex flex-col justify-between py-1">
                        <div className="h-1 bg-gray-400 rounded-sm w-full" />
                        <div className="h-1 bg-gray-400 rounded-sm w-full" />
                        <div className="h-1 bg-gray-400 rounded-sm w-full" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700">List</span>
                    </button>

                    {/* Grid 1 */}
                    <button
                      type="button"
                      onClick={() => setImagesViewType('grid1')}
                      className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                        imagesViewType === 'grid1'
                          ? 'border-[#3b82f6] bg-[#3b82f6]/5 ring-1 ring-[#3b82f6]'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {imagesViewType === 'grid1' && (
                        <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                      <div className="w-8 h-6 grid grid-cols-2 gap-1 py-1">
                        <div className="h-full bg-gray-400 rounded-sm" />
                        <div className="h-full bg-gray-400 rounded-sm" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700">Grid 1</span>
                    </button>

                    {/* Grid 2 */}
                    <button
                      type="button"
                      onClick={() => setImagesViewType('grid2')}
                      className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                        imagesViewType === 'grid2'
                          ? 'border-[#3b82f6] bg-[#3b82f6]/5 ring-1 ring-[#3b82f6]'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {imagesViewType === 'grid2' && (
                        <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                      <div className="w-8 h-6 grid grid-cols-2 gap-1 py-1">
                        <div className="h-2 bg-gray-400 rounded-sm" />
                        <div className="h-2 bg-gray-400 rounded-sm" />
                        <div className="h-2 bg-gray-400 rounded-sm" />
                        <div className="h-2 bg-gray-400 rounded-sm" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700">Grid 2</span>
                    </button>
                  </div>
                </div>

                {/* Photos Row */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#0a0909]">
                      Photos (600x600px, 1:1 or 4:5 Ratio)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {photos.map((ph, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                        <img src={ph} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xs cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    <input
                      type="file"
                      ref={galleryInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'gallery')}
                    />
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border border-dashed border-gray-300 hover:border-[#4981ff] bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-[#4981ff] shrink-0 transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setImagesCardBg(!imagesCardBg)}
                    className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                      imagesCardBg ? 'bg-[#3b82f6]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                        imagesCardBg ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-medium text-[#84868e]">Card Background</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION E: SOCIAL LINKS (Image 6) */}
          <div className="bg-white rounded-2xl border border-[#e3e5ed] overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-4 py-3 bg-[#f5f7fc] border-b border-[#e3e5ed]">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-[#84868e] cursor-grab" />
                <h3 className="font-bold font-rubik text-sm text-[#0a0909]">Social Links</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSocialSection(!showSocialSection)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    showSocialSection ? 'bg-[#3b82f6]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      showSocialSection ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => toggleCollapse('social')}
                  className="w-6 h-6 rounded-full bg-white border border-[#e3e5ed] flex items-center justify-center text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  {collapsedSections.social ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {!collapsedSections.social && showSocialSection && (
              <div className="p-4 sm:p-5 space-y-4">
                {/* Title Description Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#0a0909]">Title, Description</span>
                  <button
                    type="button"
                    onClick={() => setShowSocialTitleDesc(!showSocialTitleDesc)}
                    className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                      showSocialTitleDesc ? 'bg-[#3b82f6]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                        showSocialTitleDesc ? 'translate-x-3' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {showSocialTitleDesc && (
                  <div className="p-3.5 bg-[#f5f7fc] rounded-xl border border-[#e3e5ed] space-y-2">
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Title</label>
                      <input
                        type="text"
                        value={socialTitle}
                        onChange={(e) => setSocialTitle(e.target.value)}
                        placeholder="Social Links"
                        className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500 block mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={socialDesc}
                        onChange={(e) => setSocialDesc(e.target.value)}
                        placeholder="Description"
                        className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Social Items List */}
                <div className="space-y-3">
                  {socialItems.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 bg-[#f5f7fc] rounded-xl border border-[#e3e5ed] space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <select
                            value={s.platform}
                            onChange={(e) =>
                              setSocialItems((prev) =>
                                prev.map((item) =>
                                  item.id === s.id
                                    ? {
                                        ...item,
                                        platform: e.target.value,
                                        title: e.target.value,
                                        subtitle: `Follow us on ${e.target.value}`
                                      }
                                    : item
                                )
                              )
                            }
                            className="bg-white border border-[#e3e5ed] rounded-lg px-2.5 py-1 text-xs font-bold text-[#0a0909] outline-none"
                          >
                            <option value="Facebook">Facebook</option>
                            <option value="Instagram">Instagram</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Twitter">Twitter / X</option>
                            <option value="YouTube">YouTube</option>
                            <option value="TikTok">TikTok</option>
                          </select>
                          <input
                            type="text"
                            value={s.url}
                            onChange={(e) =>
                              setSocialItems((prev) =>
                                prev.map((item) => (item.id === s.id ? { ...item, url: e.target.value } : item))
                              )
                            }
                            placeholder="URL"
                            className="bg-white border border-[#e3e5ed] rounded-lg px-3 py-1 text-xs text-[#0a0909] outline-none flex-1 max-w-[200px]"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRemoveSocialItem(s.id)}
                            className="w-6 h-6 rounded-full bg-white border border-gray-200 text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                        </div>
                      </div>

                      {/* Icon + 1:1 Upload button */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-black ${
                            s.platform === 'Facebook'
                              ? 'bg-[#1877f2]'
                              : s.platform === 'Instagram'
                              ? 'bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af]'
                              : s.platform === 'LinkedIn'
                              ? 'bg-[#0077b5]'
                              : s.platform === 'YouTube'
                              ? 'bg-[#ff0000]'
                              : 'bg-black'
                          }`}
                        >
                          {s.platform.charAt(0)}
                        </div>
                        <div className="w-12 h-12 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white hover:text-[#4981ff] cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span className="text-[8px] mt-0.5">1:1 Ratio</span>
                        </div>
                      </div>

                      {/* Title & Subtitle inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">Title</label>
                          <input
                            type="text"
                            value={s.title}
                            onChange={(e) =>
                              setSocialItems((prev) =>
                                prev.map((item) => (item.id === s.id ? { ...item, title: e.target.value } : item))
                              )
                            }
                            className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <label className="text-[11px] text-gray-500">Subtitle</label>
                            <button
                              type="button"
                              onClick={() =>
                                setSocialItems((prev) =>
                                  prev.map((item) =>
                                    item.id === s.id ? { ...item, showSubtitle: !item.showSubtitle } : item
                                  )
                                )
                              }
                              className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                                s.showSubtitle ? 'bg-[#3b82f6]' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                                  s.showSubtitle ? 'translate-x-3' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={s.subtitle || ''}
                            onChange={(e) =>
                              setSocialItems((prev) =>
                                prev.map((item) =>
                                  item.id === s.id ? { ...item, subtitle: e.target.value } : item
                                )
                              )
                            }
                            placeholder="Follow us..."
                            className="w-full bg-white border border-[#e3e5ed] rounded-lg px-3 py-1.5 text-xs text-[#0a0909] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddSocialItem}
                    className="px-3.5 py-1.5 rounded-lg border border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION F: ADVANCED QR CODE DESIGN ACCORDION */}
          <div className="bg-white rounded-2xl border border-[#e3e5ed] overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-4 py-3 bg-[#f5f7fc] border-b border-[#e3e5ed]">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#4981ff]" />
                <h3 className="font-bold font-rubik text-sm text-[#0a0909]">
                  Design & Frame QR Code
                </h3>
              </div>
              <button
                type="button"
                onClick={() => toggleCollapse('qrDesign')}
                className="w-6 h-6 rounded-full bg-white border border-[#e3e5ed] flex items-center justify-center text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                {collapsedSections.qrDesign ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              </button>
            </div>

            {!collapsedSections.qrDesign && (
              <div className="p-4 sm:p-5 space-y-4">
                {/* Frame Stickers */}
                <div>
                  <span className="text-xs font-bold text-[#0a0909] block mb-2">QR Frame Sticker</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'none', label: 'Classic Clean' },
                      { id: 'rainbow-badge', label: 'Rainbow Scan' },
                      { id: 'top-header', label: 'Teal Card' },
                      { id: 'circular-label', label: 'Circle Red' }
                    ].map((stk) => (
                      <button
                        key={stk.id}
                        type="button"
                        onClick={() =>
                          setDesign((prev) => ({
                            ...prev,
                            frame: {
                              ...prev.frame,
                              style: stk.id as FrameStyle,
                              label: stk.id === 'rainbow-badge' ? 'SCAN ME' : stk.id === 'top-header' ? 'SCAN TO SAVE' : 'SCAN ME',
                              color: stk.id === 'top-header' ? '#0d9488' : stk.id === 'circular-label' ? '#ef4444' : '#0a0909',
                              textColor: '#ffffff'
                            }
                          }))
                        }
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                          (design.frame?.style || 'none') === stk.id
                            ? 'border-[#4981ff] bg-[#4981ff]/10 text-[#4981ff]'
                            : 'border-[#e3e5ed] hover:border-gray-300 text-[#0a0909]'
                        }`}
                      >
                        {stk.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-[#0a0909] block mb-1">
                      QR Foreground Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.foregroundColor}
                        onChange={(e) => setDesign((prev) => ({ ...prev, foregroundColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={design.foregroundColor}
                        onChange={(e) => setDesign((prev) => ({ ...prev, foregroundColor: e.target.value }))}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#e3e5ed] font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#0a0909] block mb-1">
                      QR Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.backgroundColor}
                        onChange={(e) => setDesign((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={design.backgroundColor}
                        onChange={(e) => setDesign((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#e3e5ed] font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTON: SAVE VCARD QR CODE */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveQR}
              disabled={isSaving}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>vCard QR Saved Successfully!</span>
                </>
              ) : isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving vCard QR...</span>
                </>
              ) : (
                <>
                  <span>Save vCard QR Code</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadVCard}
              className="py-3 px-4 rounded-xl border border-[#e3e5ed] bg-white hover:bg-gray-50 text-xs font-bold text-[#0a0909] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span>Download .vcf</span>
            </button>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: LIVE PHONE PREVIEW (MATCHING IMAGE 1) ================= */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-xs font-bold text-[#0a0909]">Live Mobile Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#e3e5ed] text-[11px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer"
              >
                <QrCode className="w-3 h-3 text-[#3b82f6]" />
                <span>View QR</span>
              </button>
              <a
                href={publicPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3b82f6]/10 text-[11px] font-bold text-[#3b82f6] hover:bg-[#3b82f6]/20 transition"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open Page</span>
              </a>
            </div>
          </div>

          {/* REALISTIC SMARTPHONE FRAME (MATCHING SCREENSHOT 1) */}
          <div className="relative mx-auto w-[295px] sm:w-[325px] h-[640px] bg-[#0c0d12] rounded-[48px] p-3 shadow-2xl border-[5px] border-[#22232a] select-none">
            {/* Phone Ear Speaker & Dynamic Island Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#181920]" />
              <div className="w-10 h-1.5 rounded-full bg-[#181920]" />
            </div>

            {/* Phone Screen Viewport */}
            <div className="w-full h-full rounded-[38px] overflow-y-auto bg-black text-white relative scrollbar-none flex flex-col justify-between">
              {/* ===================== TEMPLATE 1: HERO PORTRAIT (IMAGE 1) ===================== */}
              {selectedTemplate === 'hero-portrait' && (
                <div className="relative w-full min-h-full flex flex-col justify-between">
                  {/* Background Portrait Image */}
                  <div className="absolute inset-0 w-full h-[65%] z-0 overflow-hidden">
                    <img
                      src={profilePhotoUrl}
                      alt={name}
                      className="w-full h-full object-cover filter grayscale contrast-125"
                    />
                    {/* Deep Bottom Shadow Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
                  </div>

                  {/* Top / Mid Overlay Details */}
                  <div className="relative z-10 pt-28 px-5">
                    <h1 className="text-3xl font-black font-rubik tracking-tight text-white drop-shadow-md">
                      {name || 'Name'}
                    </h1>
                    <div className="text-sm font-semibold text-gray-200 mt-1 drop-shadow-sm">
                      {heading || 'Title'}
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5 drop-shadow-sm">
                      {subHeading || 'Company'}
                    </div>

                    {/* Brand Logo Teamwork.Co */}
                    {showBrandLogo && (
                      <div className="flex items-center gap-2 mt-4">
                        <div className="w-6 h-6 rounded-full bg-[#f59e0b] flex items-center justify-center text-black font-black text-xs shadow-md">
                          {brandLogoLetter}
                        </div>
                        <span className="text-sm font-bold text-white tracking-wide">
                          {brandLogoText}
                        </span>
                      </div>
                    )}

                    {/* Circular Quick Connect Action Icons */}
                    {showConnectIcons && (
                      <div className="flex items-center gap-2.5 mt-5">
                        <a
                          href={`tel:${connectIcons.find((c) => c.type === 'mobile')?.value || '123'}`}
                          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white transition shadow-sm"
                        >
                          <Smartphone className="w-4 h-4" />
                        </a>
                        <a
                          href={`mailto:${connectIcons.find((c) => c.type === 'email')?.value || 'email'}`}
                          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white transition shadow-sm"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        <a
                          href={`sms:${connectIcons.find((c) => c.type === 'sms')?.value || '123'}`}
                          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white transition shadow-sm"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setShowQRModal(true)}
                          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white transition shadow-sm"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Slide-up White Card ("About Me") */}
                  <div className="relative z-10 mt-6 bg-white text-[#0a0909] rounded-t-[32px] p-5 pb-20 shadow-2xl space-y-4">
                    {showHeadingText && (
                      <div>
                        <h2 className="text-lg font-bold font-rubik text-center text-[#0a0909]">
                          {headingTextTitle}
                        </h2>
                        <p className="text-xs text-gray-600 text-center mt-1.5 leading-relaxed">
                          {headingTextDesc}
                        </p>
                      </div>
                    )}

                    {/* Address & Contact Cards */}
                    {showContactUs && (
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                          <MapPin className="w-3.5 h-3.5 text-[#3b82f6]" />
                          <span>{addressLine1}, {city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-[#3b82f6]" />
                          <span>{contactNumbers[0]?.value || 'No phone provided'}</span>
                        </div>
                      </div>
                    )}

                    {/* Images preview if present */}
                    {showImagesSection && photos.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 block mb-1.5 uppercase tracking-wider">
                          Photos
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {photos.slice(0, 3).map((p, i) => (
                            <img key={i} src={p} alt="Gallery" className="w-full h-14 rounded-lg object-cover" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DOCKED BOTTOM ACTION BAR (MATCHING SCREENSHOT 1) */}
                  <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-between gap-2 px-1">
                    {/* QR Code button */}
                    <button
                      type="button"
                      onClick={() => setShowQRModal(true)}
                      className="w-11 h-11 rounded-full bg-[#181920] border border-white/15 text-white flex items-center justify-center hover:bg-black transition shadow-lg cursor-pointer"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>

                    {/* Share Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(publicPageUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }
                      }}
                      className="w-11 h-11 rounded-full bg-[#181920] border border-white/15 text-white flex items-center justify-center hover:bg-black transition shadow-lg cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-5 h-5 text-green-400" /> : <Upload className="w-5 h-5" />}
                    </button>

                    {/* Add to Contact + pill button */}
                    <button
                      type="button"
                      onClick={handleDownloadVCard}
                      className="flex-1 h-11 rounded-full bg-[#24252e] border border-white/15 text-white flex items-center justify-between px-4 hover:bg-black transition shadow-lg cursor-pointer"
                    >
                      <span className="text-xs font-bold">Add to Contact</span>
                      <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm">
                        +
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* ===================== TEMPLATE 2: MODERN CARD ===================== */}
              {selectedTemplate === 'modern-card' && (
                <div className="p-4 pt-10 text-[#0a0909] bg-white min-h-full flex flex-col justify-between">
                  <div>
                    {/* Header Card with Photo and Orange Accents */}
                    <div className="rounded-2xl p-4 bg-[#141b2d] text-white flex items-center gap-3 shadow-md mb-4">
                      <img
                        src={profilePhotoUrl}
                        alt={name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-orange-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <h2 className="text-base font-bold truncate">{name}</h2>
                        <div className="text-xs text-orange-400 truncate">{heading}</div>
                        <div className="text-xs text-gray-300 truncate">{subHeading}</div>
                      </div>
                    </div>

                    {/* Orange Quick Contact Icons */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {['Phone', 'Mail', 'SMS', 'WhatsApp'].map((t, idx) => (
                        <div
                          key={idx}
                          className="py-2.5 rounded-xl bg-orange-500 text-white flex flex-col items-center justify-center shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-[8px] font-bold mt-0.5">{t}</span>
                        </div>
                      ))}
                    </div>

                    {/* Social List */}
                    <div className="space-y-2 mb-4">
                      {socialItems.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:border-orange-200"
                        >
                          <span className="text-xs font-bold text-gray-800">{s.title}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadVCard}
                    className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-md mb-2 flex items-center justify-center gap-1.5"
                  >
                    <span>Add to Contact</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ===================== TEMPLATE 3: NAVY WAVE ===================== */}
              {selectedTemplate === 'navy-wave' && (
                <div className="bg-white min-h-full flex flex-col justify-between text-[#0a0909]">
                  <div>
                    {/* Top White Profile Section */}
                    <div className="pt-10 px-4 text-center">
                      <div className="relative inline-block mx-auto mb-2">
                        <img
                          src={profilePhotoUrl}
                          alt={name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md mx-auto"
                        />
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-black font-black text-xs shadow-md">
                          🏠
                        </div>
                      </div>
                      <h2 className="text-base font-bold text-gray-900">{name}</h2>
                      <div className="text-xs text-yellow-600 font-bold">{heading}</div>
                    </div>

                    {/* Dynamic Navy Wave Separator */}
                    <div className="relative mt-4 bg-[#0d1b2a] text-white pt-6 pb-6 px-4 rounded-t-[36px] shadow-lg">
                      <div className="text-center mb-4">
                        <div className="text-xs text-gray-300">{subHeading}</div>
                        <div className="flex items-center justify-center gap-2 mt-3">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="w-9 h-9 rounded-full bg-yellow-400 text-black flex items-center justify-center font-bold text-xs shadow-xs"
                            >
                              <Phone className="w-4 h-4" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/10 rounded-2xl p-3 text-xs text-gray-200 leading-relaxed backdrop-blur-xs">
                        {headingTextDesc}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0d1b2a]">
                    <button
                      type="button"
                      onClick={handleDownloadVCard}
                      className="w-full py-3 rounded-full bg-yellow-400 text-black font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>Add to Contact</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ===================== TEMPLATE 4: TEXTURED CRAFT ===================== */}
              {selectedTemplate === 'textured-craft' && (
                <div className="p-4 pt-12 bg-[#f8f6f0] min-h-full flex flex-col justify-between text-[#2c2b2a]">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-4 border-white shadow-md mb-3">
                      <img src={profilePhotoUrl} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-lg font-serif font-bold">{name}</h2>
                    <div className="text-xs uppercase tracking-widest text-gray-500 mt-0.5">{heading}</div>

                    <div className="flex items-center justify-center gap-2 my-4">
                      {['phone', 'mail', 'message', 'chat'].map((k) => (
                        <span
                          key={k}
                          className="w-8 h-8 rounded-full border border-gray-400/40 flex items-center justify-center text-gray-700 bg-white shadow-2xs"
                        >
                          <Phone className="w-3 h-3" />
                        </span>
                      ))}
                    </div>

                    <div className="p-4 bg-white/70 backdrop-blur-xs rounded-2xl border border-gray-200/50 text-xs text-left leading-relaxed text-gray-700">
                      {headingTextDesc}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadVCard}
                    className="w-full py-3 rounded-xl bg-[#2c2b2a] text-white font-bold text-xs shadow-md mt-4 flex items-center justify-center gap-1.5"
                  >
                    <span>Save Contact Card</span>
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ===================== TEMPLATE 5: CORPORATE BLUE ===================== */}
              {selectedTemplate === 'corporate-blue' && (
                <div className="bg-[#2563eb] min-h-full flex flex-col justify-between text-white">
                  <div className="pt-10 px-4 text-center">
                    <img
                      src={profilePhotoUrl}
                      alt={name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg mx-auto mb-2"
                    />
                    <h2 className="text-lg font-bold">{name}</h2>
                    <div className="text-xs text-blue-200">{heading}</div>
                    <div className="text-xs text-blue-100 font-semibold">{subHeading}</div>

                    <div className="flex items-center justify-center gap-2 my-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
                        >
                          <Phone className="w-4 h-4" />
                        </div>
                      ))}
                    </div>

                    <div className="bg-white text-gray-800 rounded-2xl p-4 text-xs text-left shadow-lg">
                      <div className="font-bold text-sm text-[#0a0909] mb-1">About Me</div>
                      <p className="text-gray-600 leading-relaxed">{headingTextDesc}</p>
                    </div>
                  </div>

                  <div className="p-4">
                    <button
                      type="button"
                      onClick={handleDownloadVCard}
                      className="w-full py-3 rounded-full bg-white text-[#2563eb] font-bold text-xs shadow-lg flex items-center justify-center gap-1.5"
                    >
                      <span>Add to Contact</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ===================== TEMPLATE 6: WARM SPLIT ===================== */}
              {selectedTemplate === 'warm-split' && (
                <div className="bg-white min-h-full flex flex-col justify-between text-[#0a0909]">
                  <div>
                    <div className="h-44 w-full overflow-hidden">
                      <img src={profilePhotoUrl} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4 text-center -mt-6">
                      <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                        <h2 className="text-base font-bold">{name}</h2>
                        <div className="text-xs text-amber-700 font-medium">{heading}</div>
                        <div className="text-xs text-gray-500 mt-1">{subHeading}</div>
                      </div>

                      <div className="mt-4 p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-left text-gray-700 leading-relaxed">
                        {headingTextDesc}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <button
                      type="button"
                      onClick={handleDownloadVCard}
                      className="w-full py-3 rounded-xl bg-[#92400e] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>Add to Contact</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hidden Canvas for QR Rendering */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* MODAL: VIEW SCANNABLE QR CODE */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="font-bold text-sm text-[#0a0909]">Scan vCard QR Code</span>
              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#f8f9fc] rounded-2xl flex items-center justify-center border border-gray-200">
              <canvas ref={modalCanvasRef} className="rounded-xl shadow-xs" />
            </div>

            <p className="text-xs text-gray-600">
              Point any mobile camera to view <strong>{name}</strong>&apos;s vCard landing page.
            </p>

            <button
              type="button"
              onClick={() => setShowQRModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#3b82f6] text-white font-bold text-xs shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
