import React from 'react';
import { LandingPageData } from '../../types';
import {
  Globe,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  MessageCircle,
  ExternalLink,
  MapPin,
  Download,
  Star,
  Sparkles,
  Briefcase,
  Feather
} from 'lucide-react';

interface PhoneMockupPreviewProps {
  data: LandingPageData;
  scale?: number;
}

export const PhoneMockupPreview: React.FC<PhoneMockupPreviewProps> = ({ data }) => {
  const theme = data.design?.theme || 'modern-blue';

  const getThemeStyles = () => {
    switch (theme) {
      case 'midnight-dark':
        return {
          bg: 'bg-[#0a0909]',
          card: 'bg-[#141416]',
          border: 'border-[#26262b]',
          text: 'text-white',
          mutedText: 'text-[#84868e]',
          btn: 'bg-[#222228] text-white hover:bg-[#2b2b34] border border-white/10',
          accent: '#4981ff',
          bannerGrad: 'from-[#1a1c29] to-[#0a0909]'
        };
      case 'sunset-coral':
        return {
          bg: 'bg-[#fff5f5]',
          card: 'bg-white',
          border: 'border-[#fed7d7]',
          text: 'text-[#2d3748]',
          mutedText: 'text-[#718096]',
          btn: 'bg-gradient-to-r from-[#ff6b6b] to-[#ffa07a] text-white shadow-xs',
          accent: '#ff6b6b',
          bannerGrad: 'from-[#ff758c] to-[#ff7eb3]'
        };
      case 'emerald-fresh':
        return {
          bg: 'bg-[#f0fdf4]',
          card: 'bg-white',
          border: 'border-[#bbf7d0]',
          text: 'text-[#14532d]',
          mutedText: 'text-[#15803d]',
          btn: 'bg-[#16a34a] text-white hover:bg-[#15803d] shadow-xs',
          accent: '#16a34a',
          bannerGrad: 'from-[#059669] to-[#10b981]'
        };
      case 'ocean-breeze':
        return {
          bg: 'bg-[#f0f9ff]',
          card: 'bg-white',
          border: 'border-[#bae6fd]',
          text: 'text-[#0c4a6e]',
          mutedText: 'text-[#0284c7]',
          btn: 'bg-[#0284c7] text-white hover:bg-[#0369a1] shadow-xs',
          accent: '#0284c7',
          bannerGrad: 'from-[#0284c7] to-[#38bdf8]'
        };
      case 'warm-amber':
        return {
          bg: 'bg-[#fffbeb]',
          card: 'bg-white',
          border: 'border-[#fde68a]',
          text: 'text-[#78350f]',
          mutedText: 'text-[#b45309]',
          btn: 'bg-[#d97706] text-white hover:bg-[#b45309] shadow-xs',
          accent: '#d97706',
          bannerGrad: 'from-[#d97706] to-[#f59e0b]'
        };
      case 'modern-blue':
      default:
        return {
          bg: 'bg-[#f5f6fb]',
          card: 'bg-white',
          border: 'border-[#e3e5ed]',
          text: 'text-[#0a0909]',
          mutedText: 'text-[#3f3e3e]',
          btn: 'bg-[#4981ff] text-white hover:bg-[#386fe3] shadow-xs',
          accent: '#4981ff',
          bannerGrad: 'from-[#4981ff] to-[#9ba2fb]'
        };
    }
  };

  const themeStyle = getThemeStyles();

  const getButtonRadius = () => {
    const s = data.design?.buttonStyle || 'rounded';
    if (s === 'pill') return 'rounded-full';
    if (s === 'sharp') return 'rounded-none';
    return 'rounded-xl';
  };

  const renderSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-3.5 h-3.5" />;
      case 'facebook': return <Facebook className="w-3.5 h-3.5" />;
      case 'twitter':
      case 'x': return <Twitter className="w-3.5 h-3.5" />;
      case 'youtube': return <Youtube className="w-3.5 h-3.5" />;
      case 'linkedin': return <Linkedin className="w-3.5 h-3.5" />;
      case 'github': return <Github className="w-3.5 h-3.5" />;
      case 'whatsapp': return <MessageCircle className="w-3.5 h-3.5" />;
      default: return <Globe className="w-3.5 h-3.5" />;
    }
  };

  const layout = data.design?.layoutTemplate || 'minimal';

  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px] h-[580px] bg-[#0a0909] rounded-[42px] p-3 shadow-2xl border-4 border-[#26262b]">
      {/* Phone Ear Speaker & Dynamic Island Notch */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1e] mr-2" />
        <div className="w-8 h-1 rounded-full bg-[#1c1c1e]" />
      </div>

      {/* Screen Viewport */}
      <div className={`w-full h-full rounded-[32px] overflow-y-auto ${themeStyle.bg} flex flex-col justify-between select-none relative scrollbar-none`}>
        {/* ======================= PDF DOCUMENT VIEWER PREVIEW ======================= */}
        {data.pdfDocument ? (
          <div className="pt-7 px-3 pb-2 flex flex-col justify-between h-full text-left">
            <div>
              {/* PDF Header */}
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/40 mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  PDF
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold block truncate text-gray-900 dark:text-white">
                    {data.pdfDocument.fileName || 'document.pdf'}
                  </span>
                  <span className="text-[9px] text-gray-500 block">
                    {data.pdfDocument.fileSize || '2.5 MB'} • {data.pdfDocument.pageCount || 6} Pages
                  </span>
                </div>
              </div>

              {/* Document Reader Sheet Preview */}
              <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-white/10 p-3 shadow-xs space-y-2">
                <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider block">
                  {data.pdfDocument.companyName || data.company || 'Official Document'}
                </span>
                <h4 className="text-xs font-bold font-rubik text-gray-950 dark:text-white leading-tight">
                  {data.title || data.pdfDocument.fileName}
                </h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                  {data.pdfDocument.description || data.bio || 'Official document provided for direct viewing and offline download.'}
                </p>

                <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg space-y-1">
                  <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded w-full" />
                  <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded w-5/6" />
                  <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
                </div>
              </div>
            </div>

            {/* Bottom Download Button */}
            <div className="pt-2">
              <div className="w-full py-2 px-3 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md">
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF ({data.pdfDocument.fileSize || '2.5 MB'})</span>
              </div>
            </div>
          </div>
        ) : (
          <>
        {/* ======================= 1. MINIMAL LAYOUT ======================= */}
        {layout === 'minimal' && (
          <div className="pt-8 px-3 text-center">
            {/* Minimal Avatar */}
            {data.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt="Avatar"
                className="w-14 h-14 rounded-full object-cover mx-auto border border-black/10 shadow-xs mb-2"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-base font-bold font-rubik mx-auto shadow-xs mb-2"
                style={{ backgroundColor: themeStyle.accent }}
              >
                {(data.title || 'M').charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex items-center justify-center gap-1">
              <span className={`text-xs font-bold font-rubik truncate max-w-[180px] ${themeStyle.text}`}>
                {data.title || 'Your Name'}
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#4981ff] shrink-0" />
            </div>

            {data.badge && (
              <span className="inline-block text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded-full mt-1 text-gray-600 dark:text-gray-300">
                {data.badge}
              </span>
            )}

            {data.bio && (
              <p className={`text-[10px] leading-relaxed line-clamp-2 mt-1.5 px-2 ${themeStyle.mutedText}`}>
                {data.bio}
              </p>
            )}

            {/* Sleek Minimal Links */}
            <div className="space-y-1.5 my-3">
              {(!data.links || data.links.length === 0) ? (
                <div className="p-3 text-[10px] text-gray-400 text-center border border-dashed border-gray-200 rounded-lg">
                  Links will appear here
                </div>
              ) : (
                data.links
                  .filter((l) => l.isActive !== false)
                  .map((link) => (
                    <div
                      key={link.id}
                      className={`flex items-center justify-between p-2 text-left bg-white/80 dark:bg-[#18181b] border border-black/5 dark:border-white/10 transition shadow-2xs ${getButtonRadius()}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="w-3.5 h-3.5 shrink-0 opacity-70" style={{ color: themeStyle.accent }} />
                        <div className="truncate">
                          <div className={`text-[11px] font-semibold truncate leading-tight ${themeStyle.text}`}>
                            {link.title}
                          </div>
                          {link.description && (
                            <div className="text-[9px] text-gray-500 truncate leading-tight">
                              {link.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-3 h-3 shrink-0 text-gray-400" />
                    </div>
                  ))
              )}
            </div>

            {/* Minimal Social & Contact Icon Bar */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 pb-1 border-t border-black/5 dark:border-white/5">
              {data.socials?.slice(0, 4).map((s, idx) => (
                <span
                  key={idx}
                  className="p-1 rounded-full bg-white dark:bg-white/10 text-gray-600 dark:text-gray-200 shadow-2xs text-[9px]"
                >
                  {renderSocialIcon(s.platform)}
                </span>
              ))}
              {data.contact?.phone && (
                <span className="p-1 rounded-full bg-white dark:bg-white/10 text-[#4981ff] shadow-2xs text-[9px]">
                  <Phone className="w-3 h-3" />
                </span>
              )}
              {data.contact?.email && (
                <span className="p-1 rounded-full bg-white dark:bg-white/10 text-[#4981ff] shadow-2xs text-[9px]">
                  <Mail className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        )}

        {/* ======================= 2. BUSINESS LAYOUT ======================= */}
        {layout === 'business' && (
          <div>
            {/* Corporate Banner */}
            <div className="relative h-18 overflow-hidden">
              {data.coverUrl ? (
                <img src={data.coverUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-r ${themeStyle.bannerGrad}`} />
              )}
            </div>

            <div className="px-3 text-center -mt-6">
              {/* Corporate Logo / Avatar */}
              {data.avatarUrl ? (
                <img
                  src={data.avatarUrl}
                  alt="Avatar"
                  className="w-14 h-14 rounded-xl object-cover mx-auto border-2 border-white shadow-md"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold font-rubik mx-auto border-2 border-white shadow-md"
                  style={{ backgroundColor: themeStyle.accent }}
                >
                  {(data.title || 'B').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex items-center justify-center gap-1 mt-1">
                <span className={`text-xs font-bold font-rubik truncate max-w-[170px] ${themeStyle.text}`}>
                  {data.title || 'Company Name'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-[#4981ff]/10 text-[#4981ff] text-[8px] font-bold">
                  OFFICIAL
                </span>
              </div>

              {data.badge && (
                <div className="text-[9px] font-medium text-gray-500 mt-0.5">
                  {data.badge}
                </div>
              )}

              {/* Corporate Action Card (Call, Email, WhatsApp, vCard) */}
              <div className="bg-white dark:bg-[#141416] rounded-xl p-2 my-2 border border-gray-100 dark:border-white/10 shadow-2xs text-left">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3 text-[#4981ff]" />
                    <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">
                      Corporate Contact Card
                    </span>
                  </div>
                  <span className="text-[8px] font-semibold text-[#16a34a] bg-[#16a34a]/10 px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="flex flex-col items-center py-1 rounded bg-gray-50 dark:bg-white/5 text-[#4981ff]">
                    <Phone className="w-2.5 h-2.5 mb-0.5" />
                    <span className="text-[8px] font-bold">Call</span>
                  </div>
                  <div className="flex flex-col items-center py-1 rounded bg-gray-50 dark:bg-white/5 text-[#4981ff]">
                    <Mail className="w-2.5 h-2.5 mb-0.5" />
                    <span className="text-[8px] font-bold">Email</span>
                  </div>
                  <div className="flex flex-col items-center py-1 rounded bg-gray-50 dark:bg-white/5 text-[#16a34a]">
                    <MessageCircle className="w-2.5 h-2.5 mb-0.5" />
                    <span className="text-[8px] font-bold">Chat</span>
                  </div>
                </div>

                {data.contact?.location && (
                  <div className="mt-1.5 pt-1 border-t border-gray-50 dark:border-white/5 flex items-center gap-1 text-[8px] text-gray-500">
                    <MapPin className="w-2.5 h-2.5 text-red-500 shrink-0" />
                    <span className="truncate">{data.contact.location}</span>
                  </div>
                )}
              </div>

              {/* Business Services / Resource Links */}
              <div className="space-y-1.5 my-2">
                {(!data.links || data.links.length === 0) ? (
                  <div className="p-2 text-[10px] text-gray-400 text-center border border-dashed border-gray-200 rounded-lg">
                    Business links appear here
                  </div>
                ) : (
                  data.links
                    .filter((l) => l.isActive !== false)
                    .map((link) => (
                      <div
                        key={link.id}
                        className={`flex items-center justify-between p-2 text-left ${getButtonRadius()} ${themeStyle.btn}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe className="w-3.5 h-3.5 shrink-0 opacity-90" />
                          <div className="truncate">
                            <div className="text-[10.5px] font-bold truncate leading-tight">
                              {link.title}
                            </div>
                            {link.description && (
                              <div className="text-[8.5px] opacity-80 truncate leading-tight">
                                {link.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-3 h-3 shrink-0 opacity-80" />
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================= 3. CREATIVE LAYOUT ======================= */}
        {layout === 'creative' && (
          <div>
            {/* Dynamic Ambient Radiant Header */}
            <div className="relative pt-6 pb-2 px-3 text-center overflow-hidden">
              <div
                className="absolute inset-0 opacity-20 blur-xl pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 30%, ${themeStyle.accent}, transparent 70%)`
                }}
              />

              {/* Creator Avatar with Colored Ring */}
              <div className="relative inline-block mx-auto mb-1.5">
                <div
                  className="w-16 h-16 rounded-full p-0.5 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${themeStyle.accent}, #ff6b6b, #9ba2fb)`
                  }}
                >
                  {data.avatarUrl ? (
                    <img
                      src={data.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center text-white text-lg font-bold font-rubik"
                      style={{ backgroundColor: themeStyle.accent }}
                    >
                      {(data.title || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white shadow-xs text-[#4981ff]">
                  <Sparkles className="w-3 h-3 fill-current" />
                </span>
              </div>

              <div className="flex items-center justify-center gap-1">
                <span className={`text-xs font-bold font-rubik truncate max-w-[170px] ${themeStyle.text}`}>
                  {data.title || 'Creator Hub'}
                </span>
                <span className="text-[9px]">✨</span>
              </div>

              <span className="inline-block text-[8px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff6b6b]/15 to-[#4981ff]/15 text-[#4981ff] mt-0.5">
                {data.badge || '✦ Featured Creator'}
              </span>

              {data.bio && (
                <p className={`text-[9.5px] leading-tight line-clamp-2 mt-1 px-1 ${themeStyle.mutedText}`}>
                  {data.bio}
                </p>
              )}

              {/* Floating Social Icons Bar */}
              {data.socials && data.socials.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 my-2">
                  {data.socials.slice(0, 5).map((s, idx) => (
                    <span
                      key={idx}
                      className="p-1 rounded-full bg-white dark:bg-white/10 text-gray-700 dark:text-white shadow-sm text-[9px] transition transform hover:scale-110"
                    >
                      {renderSocialIcon(s.platform)}
                    </span>
                  ))}
                </div>
              )}

              {/* Links List with Featured Highlight */}
              <div className="space-y-1.5 my-2 text-left">
                {(!data.links || data.links.length === 0) ? (
                  <div className="p-3 text-[10px] text-gray-400 text-center border border-dashed border-gray-200 rounded-lg">
                    Creative links will appear here
                  </div>
                ) : (
                  data.links
                    .filter((l) => l.isActive !== false)
                    .map((link, idx) => {
                      const isFeatured = idx === 0;

                      return (
                        <div
                          key={link.id}
                          className={`relative p-2 ${getButtonRadius()} transition ${
                            isFeatured
                              ? 'bg-gradient-to-r from-[#4981ff] to-[#9ba2fb] text-white shadow-md'
                              : `${themeStyle.btn}`
                          }`}
                        >
                          {isFeatured && (
                            <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 rounded-full bg-yellow-400 text-black text-[7px] font-black uppercase tracking-wider shadow-xs flex items-center gap-0.5">
                              <Star className="w-2 h-2 fill-current" />
                              <span>Featured</span>
                            </span>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-90" />
                              <div className="truncate">
                                <div className="text-[10.5px] font-bold truncate leading-tight">
                                  {link.title}
                                </div>
                                {link.description && (
                                  <div className="text-[8.5px] opacity-80 truncate leading-tight">
                                    {link.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="w-3 h-3 shrink-0 opacity-80" />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}
        </>
        )}

        {/* Footer in phone */}
        <div className="p-2 text-center border-t border-black/5 dark:border-white/5">
          <div className="text-[8px] text-gray-400 font-medium">
            Powered by <strong>qrcreative</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
