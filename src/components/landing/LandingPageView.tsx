import React, { useState, useEffect } from 'react';
import { QRCodeRecord, LandingPageData, LandingPageLink } from '../../types';
import { recordScanEvent } from '../../lib/storage';
import { getLandingPageUrl } from '../../lib/config';
import {
  Globe,
  Share2,
  ExternalLink,
  Check,
  Copy,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  Music,
  Download,
  Sparkles,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Store,
  BookOpen,
  Coffee,
  FileText,
  Star,
  ArrowRight,
  Briefcase,
  Feather
} from 'lucide-react';

interface LandingPageViewProps {
  qr: QRCodeRecord;
  onNavigateHome?: () => void;
  onCreateYourOwn?: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  qr,
  onNavigateHome,
  onCreateYourOwn
}) => {
  const [copied, setCopied] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Extract landing page configuration or build fallback from QR content
  const landingData: LandingPageData = qr.landing_page || qr.content?.landingPage || {
    slug: qr.slug || 'qr',
    title: qr.name || 'Welcome',
    bio: qr.content?.description || qr.content?.message || 'Thanks for scanning! Explore the links and resources below.',
    avatarUrl: qr.content?.avatarUrl || qr.design?.logo?.url || '',
    coverUrl: qr.content?.coverUrl || '',
    badge: qr.type === 'menu' ? 'Digital Menu' : qr.type === 'vcard' ? 'Official Business Card' : 'Verified QR Page',
    links: Array.isArray(qr.content?.links) && qr.content.links.length > 0
      ? qr.content.links.map((l: any, i: number) => ({
          id: `link_${i}`,
          title: l.platform || l.title || 'Official Website',
          url: l.url || qr.destination_url || 'https://qrcreative.vercel.app',
          description: l.description || '',
          icon: l.icon || 'globe',
          isActive: true
        }))
      : [
          {
            id: 'link_default',
            title: 'Visit Destination',
            url: qr.destination_url || qr.content?.url || 'https://qrcreative.vercel.app',
            description: 'Tap to open the destination link',
            icon: 'globe',
            isActive: true
          }
        ],
    socials: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'facebook', url: 'https://facebook.com' },
      { platform: 'whatsapp', url: 'https://wa.me/' }
    ],
    contact: {
      email: qr.content?.email || '',
      phone: qr.content?.phone || '',
      whatsapp: qr.content?.phone || '',
      location: qr.content?.city ? `${qr.content.city}, ${qr.content.country || ''}` : '',
      website: qr.destination_url || qr.content?.website || ''
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

  // Record public scan/view on mount
  useEffect(() => {
    recordScanEvent(qr.id, {
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      device_type: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop'
    });
  }, [qr.id]);

  const pageUrl = getLandingPageUrl(landingData.slug || qr.slug || 'qr');

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: landingData.title,
          text: landingData.bio,
          url: pageUrl
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setShareToast(true);
      setTimeout(() => {
        setCopied(false);
        setShareToast(false);
      }, 3000);
    }
  };

  // Download vCard
  const handleDownloadVCard = () => {
    const contact = landingData.contact || {};
    const nameParts = (landingData.title || qr.name || 'Contact').split(' ');
    const firstName = nameParts[0] || 'QR';
    const lastName = nameParts.slice(1).join(' ') || 'Contact';

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName};${firstName};;;`,
      `FN:${landingData.title}`,
      contact.phone ? `TEL;TYPE=CELL:${contact.phone}` : '',
      contact.email ? `EMAIL:${contact.email}` : '',
      contact.website ? `URL:${contact.website}` : '',
      contact.location ? `ADR:;;${contact.location};;;;` : '',
      `NOTE:${landingData.bio || 'Created with qrcreative'}`,
      'END:VCARD'
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(landingData.title || 'contact').toLowerCase().replace(/\s+/g, '-')}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Theme presets
  const theme = landingData.design?.theme || 'modern-blue';
  const getThemeStyles = () => {
    switch (theme) {
      case 'midnight-dark':
        return {
          bg: 'bg-[#0a0909]',
          cardBg: 'bg-[#141416]',
          border: 'border-[#26262b]',
          text: 'text-white',
          mutedText: 'text-[#84868e]',
          btnBg: 'bg-[#222228] hover:bg-[#2b2b34] text-white border border-white/10',
          accent: '#4981ff',
          bannerGrad: 'from-[#1a1c29] to-[#0a0909]'
        };
      case 'sunset-coral':
        return {
          bg: 'bg-[#fff5f5]',
          cardBg: 'bg-white',
          border: 'border-[#fed7d7]',
          text: 'text-[#2d3748]',
          mutedText: 'text-[#718096]',
          btnBg: 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa07a] text-white hover:opacity-95 shadow-md shadow-[#ff6b6b]/20',
          accent: '#ff6b6b',
          bannerGrad: 'from-[#ff758c] to-[#ff7eb3]'
        };
      case 'emerald-fresh':
        return {
          bg: 'bg-[#f0fdf4]',
          cardBg: 'bg-white',
          border: 'border-[#bbf7d0]',
          text: 'text-[#14532d]',
          mutedText: 'text-[#15803d]',
          btnBg: 'bg-[#16a34a] hover:bg-[#15803d] text-white shadow-md shadow-[#16a34a]/20',
          accent: '#16a34a',
          bannerGrad: 'from-[#059669] to-[#10b981]'
        };
      case 'ocean-breeze':
        return {
          bg: 'bg-[#f0f9ff]',
          cardBg: 'bg-white',
          border: 'border-[#bae6fd]',
          text: 'text-[#0c4a6e]',
          mutedText: 'text-[#0284c7]',
          btnBg: 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-md shadow-[#0284c7]/20',
          accent: '#0284c7',
          bannerGrad: 'from-[#0284c7] to-[#38bdf8]'
        };
      case 'warm-amber':
        return {
          bg: 'bg-[#fffbeb]',
          cardBg: 'bg-white',
          border: 'border-[#fde68a]',
          text: 'text-[#78350f]',
          mutedText: 'text-[#b45309]',
          btnBg: 'bg-[#d97706] hover:bg-[#b45309] text-white shadow-md shadow-[#d97706]/20',
          accent: '#d97706',
          bannerGrad: 'from-[#d97706] to-[#f59e0b]'
        };
      case 'modern-blue':
      default:
        return {
          bg: 'bg-[#f5f6fb]',
          cardBg: 'bg-white',
          border: 'border-[#e3e5ed]',
          text: 'text-[#0a0909]',
          mutedText: 'text-[#3f3e3e]',
          btnBg: 'bg-[#4981ff] hover:bg-[#386fe3] text-white shadow-sm shadow-[#4981ff]/25',
          accent: '#4981ff',
          bannerGrad: 'from-[#4981ff] to-[#9ba2fb]'
        };
    }
  };

  const themeStyle = getThemeStyles();

  const getButtonRadius = () => {
    const s = landingData.design?.buttonStyle || 'rounded';
    if (s === 'pill') return 'rounded-full';
    if (s === 'sharp') return 'rounded-none';
    return 'rounded-xl';
  };

  const renderIcon = (iconName?: string) => {
    const lower = (iconName || '').toLowerCase();
    if (lower.includes('store') || lower.includes('shop')) return <ShoppingBag className="w-5 h-5" />;
    if (lower.includes('coffee') || lower.includes('cafe')) return <Coffee className="w-5 h-5" />;
    if (lower.includes('menu') || lower.includes('food')) return <BookOpen className="w-5 h-5" />;
    if (lower.includes('music') || lower.includes('spotify')) return <Music className="w-5 h-5" />;
    if (lower.includes('video') || lower.includes('youtube')) return <Youtube className="w-5 h-5" />;
    if (lower.includes('insta')) return <Instagram className="w-5 h-5" />;
    if (lower.includes('star')) return <Star className="w-5 h-5" />;
    if (lower.includes('doc') || lower.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
  };

  const renderSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'twitter':
      case 'x': return <Twitter className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'github': return <Github className="w-4 h-4" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const vcardTemplate = landingData.vcardTemplate || (qr.type === 'vcard' ? 'hero-portrait' : null);
  const layout = landingData.design?.layoutTemplate || 'minimal';

  return (
    <div className={`min-h-screen ${themeStyle.bg} flex flex-col items-center justify-between p-4 sm:p-6 transition-colors duration-200`}>
      {/* Toast */}
      {shareToast && (
        <div className="fixed top-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0a0909] text-white text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4 text-[#4981ff]" />
          <span>Landing page link copied to clipboard!</span>
        </div>
      )}

      {/* Main Card Container */}
      <div className="w-full max-w-md mx-auto my-auto">
        <div className={`${themeStyle.cardBg} border ${themeStyle.border} rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all`}>
          
          {/* ===================== VCARD DEDICATED TEMPLATES ===================== */}
          {vcardTemplate && (
            <div>
              {/* Template 1: Hero Portrait */}
              {vcardTemplate === 'hero-portrait' && (
                <div className="relative w-full min-h-[580px] bg-black text-white flex flex-col justify-between">
                  <div className="absolute inset-0 w-full h-[65%] z-0 overflow-hidden">
                    <img
                      src={landingData.avatarUrl || landingData.coverUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80'}
                      alt={landingData.title}
                      className="w-full h-full object-cover filter grayscale contrast-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
                  </div>

                  <div className="relative z-10 pt-24 px-6">
                    <h1 className="text-3xl font-black font-rubik tracking-tight text-white drop-shadow-md">
                      {landingData.title || 'Contact Name'}
                    </h1>
                    <div className="text-sm font-semibold text-gray-200 mt-1 drop-shadow-sm">
                      {landingData.jobTitle || 'Professional'}
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5 drop-shadow-sm">
                      {landingData.company || 'Company'}
                    </div>

                    {landingData.showBrandLogo !== false && (
                      <div className="flex items-center gap-2 mt-4">
                        <div className="w-6 h-6 rounded-full bg-[#f59e0b] flex items-center justify-center text-black font-black text-xs shadow-md">
                          {(landingData.company || 'T').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-white tracking-wide">
                          {landingData.brandLogo || landingData.company || 'Teamwork.Co'}
                        </span>
                      </div>
                    )}

                    {landingData.showConnectIcons !== false && (
                      <div className="flex items-center gap-2.5 mt-5">
                        {landingData.contact?.phone && (
                          <a
                            href={`tel:${landingData.contact.phone}`}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white transition shadow-sm"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        {landingData.contact?.email && (
                          <a
                            href={`mailto:${landingData.contact.email}`}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white transition shadow-sm"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {landingData.contact?.phone && (
                          <a
                            href={`sms:${landingData.contact.phone}`}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white transition shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={handleShare}
                          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white transition shadow-sm"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 mt-6 bg-white text-[#0a0909] rounded-t-[32px] p-6 pb-24 shadow-2xl space-y-4">
                    {landingData.headingTextSection?.enabled !== false && (
                      <div>
                        <h2 className="text-lg font-bold font-rubik text-center text-[#0a0909]">
                          {landingData.headingTextSection?.title || 'About Me'}
                        </h2>
                        <p className="text-xs text-gray-600 text-center mt-1.5 leading-relaxed">
                          {landingData.headingTextSection?.description || landingData.bio}
                        </p>
                      </div>
                    )}

                    {landingData.contact?.location && (
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-2 text-xs text-gray-800">
                        <MapPin className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" />
                        <span className="truncate">{landingData.contact.location}</span>
                      </div>
                    )}

                    {landingData.imagesSection?.photos && landingData.imagesSection.photos.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 block mb-1.5 uppercase tracking-wider">
                          Photos
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {landingData.imagesSection.photos.slice(0, 3).map((p, i) => (
                            <img key={i} src={p} alt="Gallery" className="w-full h-16 rounded-xl object-cover" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-4 inset-x-4 z-30 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-12 h-12 rounded-full bg-[#181920] border border-white/15 text-white flex items-center justify-center hover:bg-black transition shadow-lg cursor-pointer"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-400" /> : <Share2 className="w-5 h-5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadVCard}
                      className="flex-1 h-12 rounded-full bg-[#24252e] border border-white/15 text-white flex items-center justify-between px-5 hover:bg-black transition shadow-lg cursor-pointer"
                    >
                      <span className="text-xs font-bold">Add to Contact</span>
                      <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm">
                        +
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Template 2: Modern Card */}
              {vcardTemplate === 'modern-card' && (
                <div className="p-6 bg-white text-[#0a0909] space-y-4">
                  <div className="rounded-2xl p-4 bg-[#141b2d] text-white flex items-center gap-4 shadow-md">
                    <img
                      src={landingData.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'}
                      alt={landingData.title}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-orange-500 shrink-0"
                    />
                    <div className="min-w-0">
                      <h2 className="text-base font-bold truncate">{landingData.title}</h2>
                      <div className="text-xs text-orange-400 truncate">{landingData.jobTitle}</div>
                      <div className="text-xs text-gray-300 truncate">{landingData.company}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {landingData.contact?.phone && (
                      <a href={`tel:${landingData.contact.phone}`} className="py-2.5 rounded-xl bg-orange-500 text-white flex flex-col items-center justify-center shadow-xs">
                        <Phone className="w-4 h-4" />
                        <span className="text-[9px] font-bold mt-0.5">Call</span>
                      </a>
                    )}
                    {landingData.contact?.email && (
                      <a href={`mailto:${landingData.contact.email}`} className="py-2.5 rounded-xl bg-orange-500 text-white flex flex-col items-center justify-center shadow-xs">
                        <Mail className="w-4 h-4" />
                        <span className="text-[9px] font-bold mt-0.5">Mail</span>
                      </a>
                    )}
                    {landingData.contact?.phone && (
                      <a href={`sms:${landingData.contact.phone}`} className="py-2.5 rounded-xl bg-orange-500 text-white flex flex-col items-center justify-center shadow-xs">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-[9px] font-bold mt-0.5">SMS</span>
                      </a>
                    )}
                    <button onClick={handleShare} className="py-2.5 rounded-xl bg-orange-500 text-white flex flex-col items-center justify-center shadow-xs">
                      <Share2 className="w-4 h-4" />
                      <span className="text-[9px] font-bold mt-0.5">Share</span>
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
                    {landingData.bio}
                  </p>

                  <button
                    type="button"
                    onClick={handleDownloadVCard}
                    className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Save Contact to Device (.vcf)</span>
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Template 3: Navy Wave / Other templates */}
              {(vcardTemplate === 'navy-wave' || vcardTemplate === 'textured-craft' || vcardTemplate === 'corporate-blue' || vcardTemplate === 'warm-split') && (
                <div className="p-6 bg-white text-[#0a0909] text-center space-y-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-4 border-white shadow-lg">
                    <img
                      src={landingData.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'}
                      alt={landingData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">{landingData.title}</h1>
                    <div className="text-xs font-semibold text-blue-600 mt-0.5">{landingData.jobTitle}</div>
                    <div className="text-xs text-gray-500">{landingData.company}</div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                    {landingData.bio}
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    {landingData.contact?.phone && (
                      <a href={`tel:${landingData.contact.phone}`} className="p-3 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition">
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {landingData.contact?.email && (
                      <a href={`mailto:${landingData.contact.email}`} className="p-3 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition">
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={handleShare} className="p-3 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadVCard}
                    className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Save Contact to Device (.vcf)</span>
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===================== 1. MINIMAL LAYOUT ===================== */}
          {!vcardTemplate && layout === 'minimal' && (
            <div className="relative px-6 pt-10 pb-8 text-center">
              {/* Quick Share Button */}
              <button
                onClick={handleShare}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/5 dark:bg-white/10 text-[#0a0909] dark:text-white hover:bg-black/10 transition cursor-pointer"
                title="Share page"
                aria-label="Share"
              >
                {copied ? <Check className="w-4 h-4 text-[#4981ff]" /> : <Share2 className="w-4 h-4" />}
              </button>

              {/* Minimal Clean Avatar */}
              <div className="mb-4 inline-block">
                {landingData.avatarUrl ? (
                  <img
                    src={landingData.avatarUrl}
                    alt={landingData.title}
                    className="w-20 h-20 rounded-full object-cover mx-auto border border-black/10 shadow-xs"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold font-rubik mx-auto shadow-xs"
                    style={{ backgroundColor: themeStyle.accent }}
                  >
                    {landingData.title.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title & Badge */}
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <h1 className={`text-xl sm:text-2xl font-bold font-rubik tracking-tight ${themeStyle.text}`}>
                  {landingData.title}
                </h1>
                <ShieldCheck className="w-5 h-5 text-[#4981ff] shrink-0" title="Verified QR Page" />
              </div>

              {landingData.badge && (
                <div className="inline-block px-2.5 py-0.5 mb-2 rounded-full text-[11px] font-semibold tracking-wide bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                  {landingData.badge}
                </div>
              )}

              {landingData.bio && (
                <p className={`text-xs sm:text-sm leading-relaxed max-w-sm mx-auto mb-5 ${themeStyle.mutedText}`}>
                  {landingData.bio}
                </p>
              )}

              {/* Minimalist Link List */}
              <div className="space-y-2.5 mb-6 text-left">
                {landingData.links
                  .filter((l) => l.isActive !== false)
                  .map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group w-full flex items-center justify-between p-3.5 ${getButtonRadius()} bg-white dark:bg-[#18181b] border border-[#e3e5ed] dark:border-white/10 hover:border-[#4981ff] transition-all shadow-2xs hover:shadow-xs cursor-pointer`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-[#f5f6fb] dark:bg-white/5 text-[#4981ff] shrink-0">
                          {renderIcon(link.icon || link.title)}
                        </div>
                        <div className="truncate">
                          <div className={`font-semibold text-sm truncate ${themeStyle.text}`}>
                            {link.title}
                          </div>
                          {link.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {link.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-[#4981ff] transition-transform group-hover:translate-x-1" />
                    </a>
                  ))}
              </div>

              {/* Minimal Social & Contact Row */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-gray-100 dark:border-white/10 mb-4">
                {landingData.socials?.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-gray-50 dark:bg-white/10 text-[#0a0909] dark:text-white hover:bg-[#4981ff] hover:text-white transition-all transform hover:scale-105"
                    title={s.platform}
                    aria-label={s.platform}
                  >
                    {renderSocialIcon(s.platform)}
                  </a>
                ))}
                {landingData.contact?.phone && (
                  <a
                    href={`tel:${landingData.contact.phone}`}
                    className="p-2.5 rounded-full bg-gray-50 dark:bg-white/10 text-[#4981ff] hover:bg-[#4981ff] hover:text-white transition-all"
                    title="Call"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {landingData.contact?.email && (
                  <a
                    href={`mailto:${landingData.contact.email}`}
                    className="p-2.5 rounded-full bg-gray-50 dark:bg-white/10 text-[#4981ff] hover:bg-[#4981ff] hover:text-white transition-all"
                    title="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Save Contact vCard */}
              <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex flex-col gap-2">
                <button
                  onClick={handleDownloadVCard}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#e3e5ed] dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-bold text-[#0a0909] dark:text-white transition"
                >
                  <Download className="w-3.5 h-3.5 text-[#4981ff]" />
                  <span>Save Contact Details (.vcf)</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================== 2. BUSINESS LAYOUT ===================== */}
          {layout === 'business' && (
            <div>
              {/* Corporate Cover Banner */}
              <div className="relative h-32 sm:h-36 overflow-hidden">
                {landingData.coverUrl ? (
                  <img
                    src={landingData.coverUrl}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-r ${themeStyle.bannerGrad}`} />
                )}

                <button
                  onClick={handleShare}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition cursor-pointer"
                  title="Share page"
                  aria-label="Share"
                >
                  {copied ? <Check className="w-4 h-4 text-[#4981ff]" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Profile Identity */}
              <div className="relative px-6 pt-0 pb-6 text-center">
                {/* Corporate Logo / Avatar */}
                <div className="-mt-12 mb-3 inline-block">
                  {landingData.avatarUrl ? (
                    <img
                      src={landingData.avatarUrl}
                      alt={landingData.title}
                      className="w-22 h-22 rounded-2xl object-cover mx-auto border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div
                      className="w-22 h-22 rounded-2xl flex items-center justify-center text-white text-2xl font-bold font-rubik mx-auto border-4 border-white shadow-lg"
                      style={{ backgroundColor: themeStyle.accent }}
                    >
                      {landingData.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Title & Official Badge */}
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <h1 className={`text-xl sm:text-2xl font-bold font-rubik tracking-tight ${themeStyle.text}`}>
                    {landingData.title}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-[#4981ff]/10 text-[#4981ff] text-[10px] font-bold">
                    OFFICIAL
                  </span>
                </div>

                {landingData.badge && (
                  <div className="text-xs font-semibold text-gray-500 mb-2">
                    {landingData.badge}
                  </div>
                )}

                {landingData.bio && (
                  <p className={`text-xs sm:text-sm leading-relaxed max-w-sm mx-auto mb-4 ${themeStyle.mutedText}`}>
                    {landingData.bio}
                  </p>
                )}

                {/* Corporate Action Card: Save Contact (.vcf), Call, Email, WhatsApp */}
                <div className="bg-[#f8f9fc] dark:bg-[#18181b] rounded-2xl p-4 mb-5 border border-gray-100 dark:border-white/10 shadow-xs text-left">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#4981ff]" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        Executive Contact Card
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded">
                      Verified Business
                    </span>
                  </div>

                  {/* Instant 1-Tap Save Contact Button */}
                  <button
                    onClick={handleDownloadVCard}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#4981ff] hover:bg-[#386fe3] text-white text-xs font-bold transition shadow-xs mb-3"
                  >
                    <Download className="w-4 h-4" />
                    <span>Save Contact to Phone (.vcf)</span>
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    {landingData.contact?.phone ? (
                      <a
                        href={`tel:${landingData.contact.phone}`}
                        className="flex flex-col items-center py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-[#4981ff] hover:bg-blue-50/50 transition"
                      >
                        <Phone className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">Call</span>
                      </a>
                    ) : (
                      <div className="flex flex-col items-center py-2 rounded-xl bg-white dark:bg-white/5 opacity-50">
                        <Phone className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">Call</span>
                      </div>
                    )}

                    {landingData.contact?.email ? (
                      <a
                        href={`mailto:${landingData.contact.email}`}
                        className="flex flex-col items-center py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-[#4981ff] hover:bg-blue-50/50 transition"
                      >
                        <Mail className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">Email</span>
                      </a>
                    ) : (
                      <div className="flex flex-col items-center py-2 rounded-xl bg-white dark:bg-white/5 opacity-50">
                        <Mail className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">Email</span>
                      </div>
                    )}

                    {landingData.contact?.whatsapp ? (
                      <a
                        href={`https://wa.me/${landingData.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-[#16a34a] hover:bg-green-50/50 transition"
                      >
                        <MessageCircle className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">Chat</span>
                      </a>
                    ) : (
                      <div className="flex flex-col items-center py-2 rounded-xl bg-white dark:bg-white/5 opacity-50">
                        <MessageCircle className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">Chat</span>
                      </div>
                    )}
                  </div>

                  {landingData.contact?.location && (
                    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-white/10 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="truncate">{landingData.contact.location}</span>
                    </div>
                  )}
                </div>

                {/* Structured Service & Resource Links */}
                <div className="space-y-3 mb-6">
                  {landingData.links
                    .filter((l) => l.isActive !== false)
                    .map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group w-full flex items-center justify-between p-3.5 ${getButtonRadius()} ${themeStyle.btnBg} transition-all duration-150 transform active:scale-[0.99] cursor-pointer`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-black/10 dark:bg-white/10 shrink-0">
                            {renderIcon(link.icon || link.title)}
                          </div>
                          <div className="text-left truncate">
                            <div className="font-semibold text-sm truncate">
                              {link.title}
                            </div>
                            {link.description && (
                              <div className="text-xs opacity-80 truncate">
                                {link.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
                      </a>
                    ))}
                </div>

                {/* Social Channels */}
                {landingData.socials && landingData.socials.length > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                    {landingData.socials.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-full bg-[#f5f6fb] dark:bg-white/10 text-[#0a0909] dark:text-white hover:bg-[#4981ff] hover:text-white transition-all transform hover:scale-105"
                        title={s.platform}
                        aria-label={s.platform}
                      >
                        {renderSocialIcon(s.platform)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== 3. CREATIVE LAYOUT ===================== */}
          {layout === 'creative' && (
            <div>
              {/* Dynamic Radiant Ambient Header */}
              <div className="relative pt-10 pb-6 px-6 text-center overflow-hidden">
                <div
                  className="absolute inset-0 opacity-25 blur-2xl pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 25%, ${themeStyle.accent}, #ff6b6b, transparent 75%)`
                  }}
                />

                <button
                  onClick={handleShare}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/10 dark:bg-white/10 text-gray-800 dark:text-white hover:bg-black/20 transition cursor-pointer z-10"
                  title="Share page"
                  aria-label="Share"
                >
                  {copied ? <Check className="w-4 h-4 text-[#4981ff]" /> : <Share2 className="w-4 h-4" />}
                </button>

                {/* Creator Avatar with Multi-color Aura Ring */}
                <div className="relative inline-block mx-auto mb-3">
                  <div
                    className="w-24 h-24 rounded-full p-1 shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${themeStyle.accent}, #ff6b6b, #9ba2fb)`
                    }}
                  >
                    {landingData.avatarUrl ? (
                      <img
                        src={landingData.avatarUrl}
                        alt={landingData.title}
                        className="w-full h-full rounded-full object-cover border-2 border-white"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-white text-2xl font-bold font-rubik"
                        style={{ backgroundColor: themeStyle.accent }}
                      >
                        {landingData.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 p-1 rounded-full bg-white shadow-md text-[#4981ff]">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <h1 className={`text-xl sm:text-2xl font-bold font-rubik tracking-tight ${themeStyle.text}`}>
                    {landingData.title}
                  </h1>
                  <span className="text-sm">✨</span>
                </div>

                <div className="inline-block px-3 py-1 mb-2 rounded-full text-xs font-bold bg-gradient-to-r from-[#ff6b6b]/15 to-[#4981ff]/15 text-[#4981ff]">
                  {landingData.badge || '✦ Featured Creator'}
                </div>

                {landingData.bio && (
                  <p className={`text-xs sm:text-sm leading-relaxed max-w-sm mx-auto mb-4 ${themeStyle.mutedText}`}>
                    {landingData.bio}
                  </p>
                )}

                {/* Floating Social Media Tiles */}
                {landingData.socials && landingData.socials.length > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                    {landingData.socials.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-full bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-md hover:scale-110 transition-transform"
                        title={s.platform}
                        aria-label={s.platform}
                      >
                        {renderSocialIcon(s.platform)}
                      </a>
                    ))}
                  </div>
                )}

                {/* Creative Link List with Featured Highlight */}
                <div className="space-y-3 mb-6 text-left">
                  {landingData.links
                    .filter((l) => l.isActive !== false)
                    .map((link, idx) => {
                      const isFeatured = idx === 0;

                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`relative group w-full flex items-center justify-between p-4 ${getButtonRadius()} transition-all duration-150 transform active:scale-[0.99] cursor-pointer ${
                            isFeatured
                              ? 'bg-gradient-to-r from-[#4981ff] to-[#9ba2fb] text-white shadow-lg'
                              : `${themeStyle.btnBg}`
                          }`}
                        >
                          {isFeatured && (
                            <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>Featured Highlight</span>
                            </span>
                          )}

                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-black/10 dark:bg-white/10 shrink-0">
                              {renderIcon(link.icon || link.title)}
                            </div>
                            <div className="truncate">
                              <div className="font-semibold text-sm truncate">
                                {link.title}
                              </div>
                              {link.description && (
                                <div className="text-xs opacity-80 truncate">
                                  {link.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
                        </a>
                      );
                    })}
                </div>

                {/* Save Contact vCard */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex flex-col gap-2">
                  <button
                    onClick={handleDownloadVCard}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#e3e5ed] dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-bold text-[#0a0909] dark:text-white transition"
                  >
                    <Download className="w-4 h-4 text-[#4981ff]" />
                    <span>Save Contact Details (.vcf)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Copy Direct Landing URL on all layouts */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 text-[11px] text-[#84868e]">
              <span className="truncate font-mono">{pageUrl}</span>
              <button
                onClick={handleShare}
                className="text-[#4981ff] font-semibold hover:underline shrink-0 ml-2 cursor-pointer"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="text-center mt-6">
          <button
            onClick={onCreateYourOwn || onNavigateHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#141416] border border-[#e3e5ed] dark:border-white/10 text-xs font-medium text-[#3f3e3e] dark:text-gray-300 hover:text-[#4981ff] shadow-sm transition"
          >
            <QrCode className="w-3.5 h-3.5 text-[#4981ff]" />
            <span>Powered by <strong>qrcreative</strong> — Create your free QR code</span>
          </button>
        </div>
      </div>
    </div>
  );
};
