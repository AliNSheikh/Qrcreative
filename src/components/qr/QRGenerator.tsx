import React, { useState, useEffect, useRef } from 'react';
import {
  QRCodeType,
  QRCodeMode,
  QRCodeDesign,
  QRCodeRecord,
  UserProfile,
  TemplatePreset
} from '../../types';
import {
  formatQRContent,
  renderQRToCanvas,
  generateQRSVG,
  checkContrastRatio,
  DESIGN_TEMPLATES
} from '../../lib/qr/generator';
import { saveQRCode } from '../../lib/storage';
import {
  Globe,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  MessageCircle,
  Wifi,
  Contact,
  MapPin,
  Calendar,
  Share2,
  Smartphone,
  FileUp,
  Download,
  Bookmark,
  Sparkles,
  AlertTriangle,
  Check,
  Copy,
  Layers,
  Palette,
  Image as ImageIcon,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface QRGeneratorProps {
  currentUser: UserProfile | null;
  onOpenAuth: (prompt?: string) => void;
  onQRSaved?: (qr: QRCodeRecord) => void;
  editingQR?: QRCodeRecord | null;
  onCancelEdit?: () => void;
  initialType?: QRCodeType;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({
  currentUser,
  onOpenAuth,
  onQRSaved,
  editingQR = null,
  onCancelEdit,
  initialType = 'url'
}) => {
  // 1. QR Type & Mode
  const [selectedType, setSelectedType] = useState<QRCodeType>(editingQR?.type || initialType);
  const [mode, setMode] = useState<QRCodeMode>(editingQR?.mode || 'static');

  // 2. Content States
  const [content, setContent] = useState<Record<string, any>>(
    editingQR?.content || {
      url: 'https://qrcreative.app',
      text: '',
      email: '',
      subject: '',
      message: '',
      phone: '',
      ssid: '',
      password: '',
      encryption: 'WPA',
      hidden: false,
      firstName: '',
      lastName: '',
      company: '',
      jobTitle: '',
      website: '',
      street: '',
      city: '',
      latitude: '37.7749',
      longitude: '-122.4194',
      title: 'Design Workshop',
      description: 'Annual creative meetup',
      location: 'Community Hall',
      startDate: '',
      endDate: '',
      links: [{ platform: 'Instagram', url: 'https://instagram.com/' }],
      iosUrl: '',
      androidUrl: '',
      fallbackUrl: '',
      fileUrl: '',
      fileName: ''
    }
  );

  // 3. Design State
  const defaultDesign: QRCodeDesign = {
    template: 'minimal',
    dotStyle: 'square',
    cornerSquareStyle: 'square',
    cornerDotStyle: 'square',
    foregroundColor: '#111827',
    backgroundColor: '#ffffff',
    gradient: {
      enabled: false,
      type: 'linear',
      color2: '#6d5dfc',
      angle: 45
    },
    logo: {
      url: null,
      size: 22,
      padding: 8,
      shape: 'square'
    },
    margin: 3,
    errorCorrectionLevel: 'M'
  };

  const [design, setDesign] = useState<QRCodeDesign>(editingQR?.design || defaultDesign);

  // Active customization tab
  const [activeDesignTab, setActiveDesignTab] = useState<'templates' | 'style' | 'colors' | 'logo'>('templates');

  // UI States
  const [qrName, setQrName] = useState<string>(editingQR?.name || 'My QR Code');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadResolution, setDownloadResolution] = useState<number>(1024);
  const [isDownloading, setIsDownloading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle Initial Type changes from external props
  useEffect(() => {
    if (initialType && !editingQR) {
      setSelectedType(initialType);
    }
  }, [initialType, editingQR]);

  // Compute formatted content
  const formattedContent = formatQRContent(
    selectedType,
    content,
    mode,
    editingQR?.slug || 'preview_slug',
    typeof window !== 'undefined' ? window.location.origin : undefined
  );

  // Contrast check
  const contrast = checkContrastRatio(design.foregroundColor, design.backgroundColor);
  const isLowContrast = contrast < 3.2;

  // Redraw QR on Canvas whenever design or content changes
  useEffect(() => {
    if (!canvasRef.current) return;
    renderQRToCanvas(canvasRef.current, formattedContent, design, 800);
  }, [formattedContent, design]);

  // Apply Template Preset
  const handleApplyTemplate = (tpl: TemplatePreset) => {
    const preset = DESIGN_TEMPLATES[tpl];
    if (preset) {
      setDesign(prev => ({
        ...prev,
        ...preset,
        template: tpl
      }));
    }
  };

  // Content Input Handlers
  const handleContentChange = (key: string, value: any) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (under 3MB for free reliability)
    if (file.size > 3 * 1024 * 1024) {
      alert('Logo file size must be under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setDesign(prev => ({
        ...prev,
        errorCorrectionLevel: 'H', // Automatic high error correction for logo scannability
        logo: {
          ...prev.logo,
          url: dataUrl
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Download Handlers
  const handleDownload = async (format: 'png' | 'svg' | 'jpeg') => {
    setIsDownloading(true);
    try {
      const fileName = `${qrName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'qrcode'}.${format}`;

      if (format === 'svg') {
        const svgString = generateQRSVG(formattedContent, design, 1024);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // High-resolution Canvas export
        const exportCanvas = document.createElement('canvas');
        await renderQRToCanvas(exportCanvas, formattedContent, design, downloadResolution);
        const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataUrl = exportCanvas.toDataURL(mime, 0.95);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        a.click();
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Save Flow
  const handleSaveClick = () => {
    if (!currentUser) {
      onOpenAuth('Create a free account to save your QR codes and edit them later.');
      return;
    }
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const saved = await saveQRCode({
        id: editingQR?.id,
        user_id: currentUser.id,
        name: qrName || 'My QR Code',
        type: selectedType,
        mode,
        content,
        slug: editingQR?.slug,
        destination_url: selectedType === 'url' ? content.url : formattedContent,
        design,
        is_active: true
      });

      setShowSaveModal(false);
      if (onQRSaved) {
        onQRSaved(saved);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save QR code');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formattedContent);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Supported QR Types definition
  const qrTypesList: Array<{ id: QRCodeType; label: string; icon: any; desc: string }> = [
    { id: 'url', label: 'Website URL', icon: Globe, desc: 'Web addresses & links' },
    { id: 'text', label: 'Plain Text', icon: FileText, desc: 'Any message or notes' },
    { id: 'wifi', label: 'Wi-Fi Network', icon: Wifi, desc: 'Join Wi-Fi instantly' },
    { id: 'vcard', label: 'vCard / Contact', icon: Contact, desc: 'Digital business card' },
    { id: 'email', label: 'Email', icon: Mail, desc: 'Send prefilled email' },
    { id: 'phone', label: 'Phone', icon: Phone, desc: 'Direct dial number' },
    { id: 'sms', label: 'SMS Message', icon: MessageSquare, desc: 'Send text message' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, desc: 'Chat on WhatsApp' },
    { id: 'event', label: 'Calendar Event', icon: Calendar, desc: 'Meeting or schedule' },
    { id: 'location', label: 'Location', icon: MapPin, desc: 'Coordinates or map' },
    { id: 'social', label: 'Social Profile', icon: Share2, desc: 'Social profile links' },
    { id: 'applinks', label: 'App Stores', icon: Smartphone, desc: 'iOS & Play Store app' },
    { id: 'file', label: 'Document / File', icon: FileUp, desc: 'Hosted file link' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Workspace Header / Editing Banner */}
      {editingQR && (
        <div className="mb-6 p-4 rounded-2xl bg-[#efedff] border border-[#6d5dfc]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#6d5dfc] text-white">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Editing QR: {editingQR.name}</h3>
              <p className="text-xs text-[#64748b]">
                {editingQR.mode === 'editable'
                  ? `Dynamic QR code · Redirect slug /r/${editingQR.slug} will be preserved!`
                  : 'Static QR code · Appearance changes will be saved.'}
              </p>
            </div>
          </div>
          {onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#64748b] hover:text-[#111827] bg-white border border-[#e2e8f0] transition"
            >
              Cancel Edit
            </button>
          )}
        </div>
      )}

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configuration Panels (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Type Selector Grid */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#6d5dfc]" />
                <span>1. Select QR Type</span>
              </h3>
              <span className="text-xs text-[#64748b]">{qrTypesList.length} free types</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {qrTypesList.map(item => {
                const isSelected = selectedType === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedType(item.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-[#6d5dfc] bg-[#efedff] text-[#5a49ef] shadow-xs'
                        : 'border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#111827]'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-[#6d5dfc]' : 'text-[#64748b]'}`} />
                    <span className="text-xs font-semibold leading-tight">{item.label}</span>
                    <span className="text-[10px] text-[#94a3b8] mt-0.5 line-clamp-1">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Static vs Editable Mode Toggle */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#13b8a6]" />
                <span>QR Mode</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b] font-medium">
                Free Feature
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('static')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  mode === 'static'
                    ? 'border-[#6d5dfc] bg-[#efedff]/50 ring-1 ring-[#6d5dfc]'
                    : 'border-[#e2e8f0] hover:bg-[#f8fafc]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#111827]">Static QR</span>
                  {mode === 'static' && <Check className="w-4 h-4 text-[#6d5dfc]" />}
                </div>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  Destination is encoded directly into the QR code image. Works offline, permanent and unchangeable once printed.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('editable')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  mode === 'editable'
                    ? 'border-[#6d5dfc] bg-[#efedff]/50 ring-1 ring-[#6d5dfc]'
                    : 'border-[#e2e8f0] hover:bg-[#f8fafc]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#111827]">Editable / Dynamic</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#13b8a6]/15 text-[#0f766e]">
                      Recommended
                    </span>
                  </div>
                  {mode === 'editable' && <Check className="w-4 h-4 text-[#6d5dfc]" />}
                </div>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  Uses a fast server redirect (<code className="text-[#6d5dfc]">/r/slug</code>). You can change the destination URL anytime without reprinting!
                </p>
              </button>
            </div>
          </div>

          {/* 3. Content Fields Panel */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-xs">
            <h3 className="text-base font-bold text-[#111827] mb-4">
              2. Add Your Content
            </h3>

            {/* URL */}
            {selectedType === 'url' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Destination Web Address
                  </label>
                  <input
                    type="url"
                    value={content.url || ''}
                    onChange={(e) => handleContentChange('url', e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm text-[#111827] placeholder-[#94a3b8] focus:border-[#6d5dfc] focus:ring-2 focus:ring-[#6d5dfc]/20 outline-none transition"
                  />
                  <p className="mt-1 text-[11px] text-[#64748b]">
                    Scanners will be opened directly to this webpage.
                  </p>
                </div>
              </div>
            )}

            {/* Plain Text */}
            {selectedType === 'text' && (
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Text Content
                </label>
                <textarea
                  rows={4}
                  value={content.text || ''}
                  onChange={(e) => handleContentChange('text', e.target.value)}
                  placeholder="Enter any text, instructions, or message..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm text-[#111827] placeholder-[#94a3b8] focus:border-[#6d5dfc] focus:ring-2 focus:ring-[#6d5dfc]/20 outline-none transition"
                />
              </div>
            )}

            {/* Wi-Fi */}
            {selectedType === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Network Name (SSID)</label>
                  <input
                    type="text"
                    value={content.ssid || ''}
                    onChange={(e) => handleContentChange('ssid', e.target.value)}
                    placeholder="e.g. Studio_Guest_5G"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm text-[#111827] outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">Wi-Fi Password</label>
                    <input
                      type="text"
                      value={content.password || ''}
                      onChange={(e) => handleContentChange('password', e.target.value)}
                      placeholder="Enter network password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm text-[#111827] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">Security Encryption</label>
                    <select
                      value={content.encryption || 'WPA'}
                      onChange={(e) => handleContentChange('encryption', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm text-[#111827] bg-white outline-none"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None (Open Network)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="hiddenNet"
                    checked={content.hidden || false}
                    onChange={(e) => handleContentChange('hidden', e.target.checked)}
                    className="rounded border-[#cbd5e1] text-[#6d5dfc]"
                  />
                  <label htmlFor="hiddenNet" className="text-xs text-[#64748b]">Hidden network SSID</label>
                </div>
              </div>
            )}

            {/* vCard / Contact */}
            {selectedType === 'vcard' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">First Name</label>
                    <input
                      type="text"
                      value={content.firstName || ''}
                      onChange={(e) => handleContentChange('firstName', e.target.value)}
                      placeholder="Jane"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#cbd5e1] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">Last Name</label>
                    <input
                      type="text"
                      value={content.lastName || ''}
                      onChange={(e) => handleContentChange('lastName', e.target.value)}
                      placeholder="Doe"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#cbd5e1] text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">Company</label>
                    <input
                      type="text"
                      value={content.company || ''}
                      onChange={(e) => handleContentChange('company', e.target.value)}
                      placeholder="Studio Labs"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#cbd5e1] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">Job Title</label>
                    <input
                      type="text"
                      value={content.jobTitle || ''}
                      onChange={(e) => handleContentChange('jobTitle', e.target.value)}
                      placeholder="Creative Director"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#cbd5e1] text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={content.phone || ''}
                      onChange={(e) => handleContentChange('phone', e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#cbd5e1] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">Email</label>
                    <input
                      type="email"
                      value={content.email || ''}
                      onChange={(e) => handleContentChange('email', e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#cbd5e1] text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Website</label>
                  <input
                    type="url"
                    value={content.website || ''}
                    onChange={(e) => handleContentChange('website', e.target.value)}
                    placeholder="https://janedoe.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            {selectedType === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Recipient Email</label>
                  <input
                    type="email"
                    value={content.email || ''}
                    onChange={(e) => handleContentChange('email', e.target.value)}
                    placeholder="hello@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Subject Line</label>
                  <input
                    type="text"
                    value={content.subject || ''}
                    onChange={(e) => handleContentChange('subject', e.target.value)}
                    placeholder="Inquiry from qrcreative"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Message Body</label>
                  <textarea
                    rows={3}
                    value={content.message || ''}
                    onChange={(e) => handleContentChange('message', e.target.value)}
                    placeholder="Hello, I would like to learn more..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
              </div>
            )}

            {/* Phone */}
            {selectedType === 'phone' && (
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={content.phone || ''}
                  onChange={(e) => handleContentChange('phone', e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                />
              </div>
            )}

            {/* SMS */}
            {selectedType === 'sms' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Recipient Phone</label>
                  <input
                    type="tel"
                    value={content.phone || ''}
                    onChange={(e) => handleContentChange('phone', e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Pre-filled SMS Text</label>
                  <textarea
                    rows={3}
                    value={content.message || ''}
                    onChange={(e) => handleContentChange('message', e.target.value)}
                    placeholder="RSVP YES for Saturday..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
              </div>
            )}

            {/* WhatsApp */}
            {selectedType === 'whatsapp' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">WhatsApp Phone (with Country Code)</label>
                  <input
                    type="tel"
                    value={content.phone || ''}
                    onChange={(e) => handleContentChange('phone', e.target.value)}
                    placeholder="15552345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Initial Chat Message</label>
                  <input
                    type="text"
                    value={content.message || ''}
                    onChange={(e) => handleContentChange('message', e.target.value)}
                    placeholder="Hi! I scanned your QR code on qrcreative."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
              </div>
            )}

            {/* Event */}
            {selectedType === 'event' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Event Title</label>
                  <input
                    type="text"
                    value={content.title || ''}
                    onChange={(e) => handleContentChange('title', e.target.value)}
                    placeholder="Product Launch 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={content.startDate || ''}
                      onChange={(e) => handleContentChange('startDate', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#cbd5e1] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={content.endDate || ''}
                      onChange={(e) => handleContentChange('endDate', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#cbd5e1] text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Location</label>
                  <input
                    type="text"
                    value={content.location || ''}
                    onChange={(e) => handleContentChange('location', e.target.value)}
                    placeholder="Main Auditorium / Online Stream"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
              </div>
            )}

            {/* Location */}
            {selectedType === 'location' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Latitude</label>
                  <input
                    type="text"
                    value={content.latitude || ''}
                    onChange={(e) => handleContentChange('latitude', e.target.value)}
                    placeholder="37.7749"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Longitude</label>
                  <input
                    type="text"
                    value={content.longitude || ''}
                    onChange={(e) => handleContentChange('longitude', e.target.value)}
                    placeholder="-122.4194"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
              </div>
            )}

            {/* Social */}
            {selectedType === 'social' && (
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">Social Profile Link</label>
                <input
                  type="url"
                  value={content.links?.[0]?.url || ''}
                  onChange={(e) => handleContentChange('links', [{ platform: 'Social', url: e.target.value }])}
                  placeholder="https://instagram.com/yourbrand"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                />
              </div>
            )}

            {/* App links */}
            {selectedType === 'applinks' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Apple App Store URL</label>
                  <input
                    type="url"
                    value={content.iosUrl || ''}
                    onChange={(e) => handleContentChange('iosUrl', e.target.value)}
                    placeholder="https://apps.apple.com/app/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">Google Play Store URL</label>
                  <input
                    type="url"
                    value={content.androidUrl || ''}
                    onChange={(e) => handleContentChange('androidUrl', e.target.value)}
                    placeholder="https://play.google.com/store/apps/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                </div>
              </div>
            )}

            {/* File / PDF */}
            {selectedType === 'file' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">File Link or Cloud Document URL</label>
                  <input
                    type="url"
                    value={content.fileUrl || ''}
                    onChange={(e) => handleContentChange('fileUrl', e.target.value)}
                    placeholder="https://example.com/menu.pdf"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm"
                  />
                  <p className="mt-1 text-[11px] text-[#64748b]">
                    Free tier: Paste any direct link to your PDF, document, or Supabase Storage asset.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4. Customization Accordions / Tabs */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#6d5dfc]" />
                <span>3. Customize Appearance</span>
              </h3>
              <span className="text-xs text-[#13b8a6] font-semibold">100% Free Customization</span>
            </div>

            {/* Sub Tabs */}
            <div className="flex border-b border-[#e2e8f0] mb-5 gap-4">
              {[
                { id: 'templates', label: 'Presets' },
                { id: 'style', label: 'Shapes' },
                { id: 'colors', label: 'Colors' },
                { id: 'logo', label: 'Logo' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDesignTab(tab.id as any)}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition ${
                    activeDesignTab === tab.id
                      ? 'border-[#6d5dfc] text-[#6d5dfc]'
                      : 'border-transparent text-[#64748b] hover:text-[#111827]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB: Templates */}
            {activeDesignTab === 'templates' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'minimal', label: 'Minimal', desc: 'Clean high-contrast' },
                  { id: 'bold', label: 'Bold', desc: 'Deep contrast tone' },
                  { id: 'soft', label: 'Soft', desc: 'Rounded violet' },
                  { id: 'tech', label: 'Tech', desc: 'Cyan pill curves' },
                  { id: 'mono', label: 'Mono', desc: 'Pure ink black' },
                  { id: 'gradient', label: 'Gradient', desc: 'Violet to pink' },
                  { id: 'business', label: 'Business', desc: 'Navy corporate' },
                  { id: 'creative', label: 'Creative', desc: 'Teal & purple dots' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleApplyTemplate(item.id as TemplatePreset)}
                    className={`p-3 rounded-xl border text-left transition ${
                      design.template === item.id
                        ? 'border-[#6d5dfc] bg-[#efedff] text-[#5a49ef]'
                        : 'border-[#e2e8f0] hover:bg-[#f8fafc] text-[#111827]'
                    }`}
                  >
                    <span className="text-xs font-bold block">{item.label}</span>
                    <span className="text-[10px] text-[#94a3b8] block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* TAB: Shapes */}
            {activeDesignTab === 'style' && (
              <div className="space-y-5">
                {/* Body Pattern */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-2">QR Body Pattern</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'square', label: 'Square' },
                      { id: 'rounded', label: 'Rounded' },
                      { id: 'dots', label: 'Dots' },
                      { id: 'extra-rounded', label: 'Smooth' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setDesign(prev => ({ ...prev, dotStyle: st.id as any }))}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                          design.dotStyle === st.id
                            ? 'border-[#6d5dfc] bg-[#efedff] text-[#6d5dfc]'
                            : 'border-[#e2e8f0] hover:bg-[#f8fafc] text-[#64748b]'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Corner Outer Box */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-2">Corner Eye Outer Style</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'square', label: 'Square' },
                      { id: 'rounded', label: 'Rounded' },
                      { id: 'extra-rounded', label: 'Pill' },
                      { id: 'circle', label: 'Circle' }
                    ].map(co => (
                      <button
                        key={co.id}
                        type="button"
                        onClick={() => setDesign(prev => ({ ...prev, cornerSquareStyle: co.id as any }))}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                          design.cornerSquareStyle === co.id
                            ? 'border-[#6d5dfc] bg-[#efedff] text-[#6d5dfc]'
                            : 'border-[#e2e8f0] hover:bg-[#f8fafc] text-[#64748b]'
                        }`}
                      >
                        {co.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Corner Inner Dot */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-2">Corner Eye Center Dot</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'square', label: 'Square' },
                      { id: 'rounded', label: 'Rounded' },
                      { id: 'dot', label: 'Circle Dot' }
                    ].map(ci => (
                      <button
                        key={ci.id}
                        type="button"
                        onClick={() => setDesign(prev => ({ ...prev, cornerDotStyle: ci.id as any }))}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                          design.cornerDotStyle === ci.id
                            ? 'border-[#6d5dfc] bg-[#efedff] text-[#6d5dfc]'
                            : 'border-[#e2e8f0] hover:bg-[#f8fafc] text-[#64748b]'
                        }`}
                      >
                        {ci.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Margin Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[#111827]">Quiet Zone / Margin</label>
                    <span className="text-xs text-[#64748b]">{design.margin} cells</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={design.margin}
                    onChange={(e) => setDesign(prev => ({ ...prev, margin: parseInt(e.target.value) }))}
                    className="w-full accent-[#6d5dfc]"
                  />
                </div>
              </div>
            )}

            {/* TAB: Colors */}
            {activeDesignTab === 'colors' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Foreground */}
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">Foreground Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.foregroundColor}
                        onChange={(e) => setDesign(prev => ({ ...prev, foregroundColor: e.target.value }))}
                        className="w-9 h-9 rounded-xl border border-[#cbd5e1] cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={design.foregroundColor}
                        onChange={(e) => setDesign(prev => ({ ...prev, foregroundColor: e.target.value }))}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-[#cbd5e1] text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Background */}
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1.5">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.backgroundColor === 'transparent' ? '#ffffff' : design.backgroundColor}
                        onChange={(e) => setDesign(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-9 h-9 rounded-xl border border-[#cbd5e1] cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={design.backgroundColor}
                        onChange={(e) => setDesign(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-[#cbd5e1] text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Gradient Toggle */}
                <div className="pt-2 border-t border-[#f1f5f9]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#111827]">Gradient Pattern</span>
                    <button
                      type="button"
                      onClick={() => setDesign(prev => ({
                        ...prev,
                        gradient: { ...prev.gradient, enabled: !prev.gradient.enabled }
                      }))}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        design.gradient.enabled
                          ? 'bg-[#6d5dfc] text-white'
                          : 'bg-[#f1f5f9] text-[#64748b]'
                      }`}
                    >
                      {design.gradient.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {design.gradient.enabled && (
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Secondary Gradient Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={design.gradient.color2}
                            onChange={(e) => setDesign(prev => ({
                              ...prev,
                              gradient: { ...prev.gradient, color2: e.target.value }
                            }))}
                            className="w-8 h-8 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={design.gradient.color2}
                            onChange={(e) => setDesign(prev => ({
                              ...prev,
                              gradient: { ...prev.gradient, color2: e.target.value }
                            }))}
                            className="w-full px-2 py-1 text-xs font-mono border rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Angle ({design.gradient.angle}°)</label>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="15"
                          value={design.gradient.angle}
                          onChange={(e) => setDesign(prev => ({
                            ...prev,
                            gradient: { ...prev.gradient, angle: parseInt(e.target.value) }
                          }))}
                          className="w-full accent-[#6d5dfc] mt-2"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Logo */}
            {activeDesignTab === 'logo' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-[#111827]">Center Brand Logo</label>
                    <p className="text-[11px] text-[#64748b]">Upload PNG, SVG, or JPEG (automatic high error correction enabled)</p>
                  </div>
                  {design.logo.url && (
                    <button
                      type="button"
                      onClick={() => setDesign(prev => ({
                        ...prev,
                        logo: { ...prev.logo, url: null }
                      }))}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-[#6d5dfc] bg-[#efedff]/40 hover:bg-[#efedff] text-xs font-semibold text-[#6d5dfc] transition">
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload Logo Image</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {design.logo.url && (
                    <div className="w-10 h-10 rounded-xl border p-1 bg-white flex items-center justify-center shadow-xs">
                      <img src={design.logo.url} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                </div>

                {design.logo.url && (
                  <div className="space-y-3 pt-3 border-t border-[#f1f5f9]">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-[#111827]">Logo Size</label>
                        <span className="text-xs text-[#64748b]">{design.logo.size}%</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="28"
                        value={design.logo.size}
                        onChange={(e) => setDesign(prev => ({
                          ...prev,
                          logo: { ...prev.logo, size: parseInt(e.target.value) }
                        }))}
                        className="w-full accent-[#6d5dfc]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#111827] mb-1">Badge Shape</label>
                        <select
                          value={design.logo.shape}
                          onChange={(e) => setDesign(prev => ({
                            ...prev,
                            logo: { ...prev.logo, shape: e.target.value as any }
                          }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-white"
                        >
                          <option value="square">Rounded Square</option>
                          <option value="circle">Circle</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#111827] mb-1">Badge Padding ({design.logo.padding}px)</label>
                        <input
                          type="range"
                          min="2"
                          max="16"
                          value={design.logo.padding}
                          onChange={(e) => setDesign(prev => ({
                            ...prev,
                            logo: { ...prev.logo, padding: parseInt(e.target.value) }
                          }))}
                          className="w-full accent-[#6d5dfc] mt-2"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live QR Preview Panel (5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-md flex flex-col items-center">
            {/* Header badges */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#f1f5f9] text-[#111827] uppercase tracking-wider">
                  {selectedType}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  mode === 'editable'
                    ? 'bg-[#13b8a6]/15 text-[#0f766e]'
                    : 'bg-[#f1f5f9] text-[#64748b]'
                }`}>
                  {mode === 'editable' ? 'Editable / Dynamic' : 'Static QR'}
                </span>
              </div>

              {/* Scannability status badge */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isLowContrast ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                <span className="text-xs text-[#64748b]">
                  {isLowContrast ? 'Low Contrast' : 'High Scannability'}
                </span>
              </div>
            </div>

            {/* Scannability Warning */}
            {isLowContrast && (
              <div className="w-full mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Low contrast warning:</strong> This color combination may make this QR code harder to scan in poor lighting. Consider a darker foreground color.
                </span>
              </div>
            )}

            {/* QR Canvas Preview Frame */}
            <div className="relative p-6 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center shadow-inner group">
              <canvas
                ref={canvasRef}
                className="max-w-full w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-xl transition shadow-xs"
              />
            </div>

            {/* Destination summary & copy link */}
            <div className="w-full mt-4 p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs">
              <div className="flex items-center justify-between text-[#64748b] mb-1">
                <span>{mode === 'editable' ? 'Dynamic Redirect Destination:' : 'Encoded Payload:'}</span>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 text-[#6d5dfc] hover:underline font-medium"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="font-mono text-[11px] text-[#111827] truncate select-all">
                {formattedContent}
              </p>
            </div>

            {/* Download & Save Controls */}
            <div className="w-full mt-5 space-y-2.5">
              {/* Primary Download Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleDownload('png')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#6d5dfc] hover:bg-[#5a49ef] shadow-sm shadow-[#6d5dfc]/20 transition active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleDownload('svg')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-[#111827] bg-white border border-[#cbd5e1] hover:bg-[#f8fafc] transition active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 text-[#64748b]" />
                  <span>Download SVG</span>
                </button>
              </div>

              {/* Resolution selection & JPEG option */}
              <div className="flex items-center justify-between text-xs text-[#64748b] px-1">
                <div className="flex items-center gap-2">
                  <span>PNG Resolution:</span>
                  {[512, 1024, 2048].map(res => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setDownloadResolution(res)}
                      className={`px-2 py-0.5 rounded ${
                        downloadResolution === res
                          ? 'bg-[#efedff] text-[#6d5dfc] font-bold'
                          : 'hover:text-[#111827]'
                      }`}
                    >
                      {res}px
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload('jpeg')}
                  className="hover:text-[#6d5dfc] underline font-medium"
                >
                  JPEG
                </button>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveClick}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-[#6d5dfc] bg-[#efedff] hover:bg-[#e4e1ff] transition active:scale-[0.98]"
              >
                <Bookmark className="w-4 h-4" />
                <span>{editingQR ? 'Save Changes' : 'Save to My Account'}</span>
              </button>

              <p className="text-center text-[11px] text-[#94a3b8]">
                Free downloads without watermarks or forced registration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal Dialog */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#e2e8f0]">
            <h3 className="text-lg font-bold text-[#111827] mb-1">
              {editingQR ? 'Save QR Code Changes' : 'Save QR Code to Account'}
            </h3>
            <p className="text-xs text-[#64748b] mb-4">
              Give your QR code a name so you can find, organize, and edit it from your personal dashboard.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  QR Code Name
                </label>
                <input
                  type="text"
                  value={qrName}
                  onChange={(e) => setQrName(e.target.value)}
                  placeholder="e.g. Website Homepage / Menu 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm text-[#111827] outline-none focus:border-[#6d5dfc] focus:ring-2 focus:ring-[#6d5dfc]/20"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#64748b] space-y-1">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-semibold text-[#111827] uppercase">{selectedType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="font-semibold text-[#111827] capitalize">{mode}</span>
                </div>
                {mode === 'editable' && (
                  <p className="text-[11px] text-[#0f766e] pt-1">
                    You can change the destination URL in your dashboard anytime without reprinting!
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving || !qrName.trim()}
                  onClick={handleConfirmSave}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#6d5dfc] hover:bg-[#5a49ef] disabled:opacity-60 transition"
                >
                  {isSaving ? 'Saving...' : 'Save QR Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
