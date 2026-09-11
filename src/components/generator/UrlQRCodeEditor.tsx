import React, { useState, useEffect, useRef } from 'react';
import {
  QRCodeRecord,
  QRCodeDesign,
  UserProfile,
  FrameStyle,
  DotStyle,
  CornerSquareStyle
} from '../../types';
import {
  renderQRToCanvas,
  generateQRSVG,
  formatQRContent,
  DESIGN_TEMPLATES
} from '../../lib/qr/generator';
import { saveQRCode } from '../../lib/storage';
import { getSiteUrl } from '../../lib/config';
import {
  Globe,
  Link2,
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
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface UrlQRCodeEditorProps {
  currentUser: UserProfile | null;
  onOpenAuth: (prompt?: string) => void;
  onQRSaved?: (qr: QRCodeRecord) => void;
  editingQR?: QRCodeRecord | null;
  onCancelEdit?: () => void;
  onSwitchToLanding?: () => void;
}

type QuickTab = 'STICKER' | 'COLOR' | 'SHAPES' | 'LOGO';

export const UrlQRCodeEditor: React.FC<UrlQRCodeEditorProps> = ({
  currentUser,
  onOpenAuth,
  onQRSaved,
  editingQR = null,
  onCancelEdit,
  onSwitchToLanding
}) => {
  // 1. Content states
  const [url, setUrl] = useState<string>(() => {
    if (editingQR?.content?.url) return editingQR.content.url;
    return 'https://';
  });

  const [isDynamic, setIsDynamic] = useState<boolean>(() => {
    if (editingQR) return editingQR.mode === 'editable';
    return true; // Dynamic by default for tracking and flexibility
  });

  const [trackPreciseLocation, setTrackPreciseLocation] = useState<boolean>(() => {
    if (editingQR?.content?.trackPreciseLocation !== undefined) {
      return Boolean(editingQR.content.trackPreciseLocation);
    }
    return false;
  });

  const [qrName, setQrName] = useState<string>(() => {
    if (editingQR?.name) return editingQR.name;
    return 'Website QR Code';
  });

  // 2. Bulk Upload mode toggle
  const [bulkUploadActive, setBulkUploadActive] = useState(false);
  const [bulkUrlsText, setBulkUrlsText] = useState('');
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkResults, setBulkResults] = useState<string[]>([]);

  // 3. Accordion expansion states
  const [basicInfoOpen, setBasicInfoOpen] = useState(true);
  const [designAccordionOpen, setDesignAccordionOpen] = useState(false);

  // 4. Quick design category tab (Right column)
  const [activeQuickTab, setActiveQuickTab] = useState<QuickTab>('STICKER');

  // 5. QR Design State
  const [design, setDesign] = useState<QRCodeDesign>(() => {
    if (editingQR?.design) return editingQR.design;
    return {
      template: 'minimal',
      dotStyle: 'square',
      cornerSquareStyle: 'square',
      cornerDotStyle: 'square',
      foregroundColor: '#0a0909',
      backgroundColor: '#ffffff',
      gradient: {
        enabled: false,
        type: 'linear',
        color2: '#3b82f6',
        angle: 45
      },
      logo: {
        url: null,
        size: 20,
        padding: 4,
        shape: 'square'
      },
      frame: {
        style: 'none',
        text: 'SCAN ME',
        color: '#3b82f6'
      },
      margin: 3,
      errorCorrectionLevel: 'M'
    };
  });

  // 6. Execution & Feedback
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic slug for redirect tracking
  const [slug] = useState<string>(() => {
    if (editingQR?.slug) return editingQR.slug;
    return Math.random().toString(36).substring(2, 8);
  });

  // Compute text to encode into the QR pattern
  const destinationUrl = isDynamic
    ? `${getSiteUrl().replace(/\/$/, '')}/r/${slug}`
    : (url.trim() || 'https://www.yoursite.com');

  // Render QR Canvas whenever design or content changes
  useEffect(() => {
    let isSubscribed = true;

    async function draw() {
      if (!canvasRef.current) return;
      try {
        const textToEncode = destinationUrl;
        await renderQRToCanvas(canvasRef.current, textToEncode, design, 320);
      } catch (err) {
        console.error('Failed to render QR on canvas:', err);
      }
    }

    draw();
    return () => {
      isSubscribed = false;
    };
  }, [destinationUrl, design]);

  // Handle Save QR Code
  const handleSave = async () => {
    const cleanUrl = url.trim();
    if (!cleanUrl || cleanUrl === 'https://' || cleanUrl === 'http://') {
      alert('Please enter a valid website URL before saving.');
      return;
    }

    setSaving(true);
    try {
      const savedRecord = await saveQRCode({
        id: editingQR?.id,
        user_id: currentUser?.id || 'anonymous',
        name: qrName.trim() || 'Website QR Code',
        type: 'url',
        mode: isDynamic ? 'editable' : 'static',
        slug: isDynamic ? slug : undefined,
        destination_url: cleanUrl,
        content: {
          url: cleanUrl,
          trackPreciseLocation
        },
        design,
        is_active: true
      });

      setSaveSuccess(true);
      if (onQRSaved) {
        onQRSaved(savedRecord);
      }

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving QR Code:', err);
      alert('Failed to save QR Code. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Download (PNG, SVG, PDF)
  const handleDownload = (format: 'png' | 'svg' | 'pdf') => {
    if (!canvasRef.current) return;

    const fileName = `${(qrName || 'website-qr').toLowerCase().replace(/\s+/g, '-')}.${format}`;

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    } else if (format === 'svg') {
      const svgString = generateQRSVG(destinationUrl, design, 800);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const link = document.createElement('a');
      link.download = fileName;
      link.href = URL.createObjectURL(blob);
      link.click();
    } else if (format === 'pdf') {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head><title>${qrName} - Print Preview</title></head>
            <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
              <h2 style="margin-bottom:8px;">${qrName}</h2>
              <p style="color:#64748b;font-size:12px;margin-top:0;">${destinationUrl}</p>
              <img src="${dataUrl}" style="width:300px;height:300px;" />
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  // Bulk Generation Execution
  const handleBulkGenerate = () => {
    const rawLines = bulkUrlsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && (l.startsWith('http://') || l.startsWith('https://') || l.includes('.')));

    if (rawLines.length === 0) {
      alert('Please enter at least one valid website URL in the bulk field.');
      return;
    }

    setBulkGenerating(true);
    setTimeout(() => {
      setBulkResults(rawLines);
      setBulkGenerating(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 font-sans text-[#0a0909]">
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-2">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold font-rubik tracking-tight text-[#0a0909]">
            Create a Custom QR Code
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Generate high-resolution scannable QR codes for websites and links.
          </p>
        </div>

        {/* Bulk Upload Switch */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-gray-200">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={bulkUploadActive}
              onChange={(e) => setBulkUploadActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3b82f6]"></div>
          </label>
          <span className="text-sm font-medium text-[#1e293b]">Bulk Upload</span>
          <div className="relative inline-block">
            <button
              type="button"
              onMouseEnter={() => setActiveTooltip('bulk')}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={() => setActiveTooltip(activeTooltip === 'bulk' ? null : 'bulk')}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {activeTooltip === 'bulk' && (
              <div className="absolute right-0 top-6 z-50 w-64 p-2.5 bg-gray-900 text-white text-xs rounded-xl shadow-lg leading-relaxed">
                Bulk Upload lets you generate dozens or hundreds of custom URL QR codes simultaneously from a list or CSV file.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= BULK UPLOAD VIEW (WHEN TOGGLED) ================= */}
      {bulkUploadActive ? (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm mb-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-3 text-[#3b82f6]">
            <FileSpreadsheet className="w-5 h-5" />
            <h3 className="font-bold font-rubik text-base text-[#0a0909]">Batch URL QR Generator</h3>
          </div>
          <p className="text-xs text-[#64748b] mb-4">
            Paste one URL per line or upload a list to generate multiple scannable codes in bulk.
          </p>

          <textarea
            rows={5}
            value={bulkUrlsText}
            onChange={(e) => setBulkUrlsText(e.target.value)}
            placeholder={`https://example.com/promo\nhttps://example.com/summer-sale\nhttps://example.com/contact`}
            className="w-full text-xs font-mono p-3.5 rounded-xl border border-gray-300 focus:border-[#3b82f6] outline-none"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBulkGenerate}
              disabled={bulkGenerating}
              className="px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              {bulkGenerating ? 'Processing Batch...' : `Generate Batch Codes`}
            </button>
            <button
              type="button"
              onClick={() => setBulkUploadActive(false)}
              className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
            >
              Return to Single QR Code
            </button>
          </div>

          {bulkResults.length > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-700 mb-2">
                Generated {bulkResults.length} QR Code Destinations:
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono">
                {bulkResults.map((bUrl, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 px-2 hover:bg-white rounded">
                    <span className="truncate max-w-md text-gray-800">{bUrl}</span>
                    <span className="text-[#3b82f6] font-semibold text-[11px]">Ready</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* ================= MAIN 2-COLUMN WORKSPACE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN: ACCORDIONS & SAVE ================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* ACCORDION 1: BASIC INFORMATION */}
          <div className="rounded-2xl border border-[#e2e8f0] overflow-hidden bg-white shadow-xs transition-all">
            {/* Accordion Header */}
            <div
              onClick={() => setBasicInfoOpen(!basicInfoOpen)}
              className="flex items-center justify-between px-5 py-4 bg-[#f0f3ff] hover:bg-[#ebf0fe] cursor-pointer transition select-none"
            >
              <h3 className="text-base font-bold font-rubik text-[#1e293b]">
                Basic Information
              </h3>
              <div className="w-7 h-7 rounded-full bg-white shadow-2xs border border-[#cbd5e1] flex items-center justify-center text-gray-700">
                {basicInfoOpen ? (
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
              </div>
            </div>

            {/* Accordion Body */}
            {basicInfoOpen && (
              <div className="p-6 space-y-5">
                {/* Website or Page URL Field */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-sm font-normal text-[#475569]">
                    Website or Page URL
                  </label>
                  <div className="sm:col-span-8 relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.yoursite.com"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] hover:border-gray-400 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/15 outline-none transition placeholder-gray-400 text-[#0a0909]"
                    />
                    {url && url !== 'https://' && (
                      <a
                        href={url.startsWith('http') ? url : `https://${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-3 text-gray-400 hover:text-[#3b82f6] transition"
                        title="Test URL in new window"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Checkbox 1: Make dynamic */}
                <div className="pt-2 sm:ml-[33.33%] space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isDynamic}
                      onChange={(e) => setIsDynamic(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6] cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-[#334155] leading-snug">
                      <span>Make dynamic (for analytics and editing without re-printing)</span>
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onMouseEnter={() => setActiveTooltip('dynamic')}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={() => setActiveTooltip(activeTooltip === 'dynamic' ? null : 'dynamic')}
                          className="text-gray-400 hover:text-gray-600 align-middle"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                        {activeTooltip === 'dynamic' && (
                          <div className="absolute left-6 top-0 z-50 w-64 p-2.5 bg-gray-900 text-white text-xs rounded-xl shadow-lg leading-relaxed">
                            Dynamic QR codes pass through a short redirect link. This lets you update your destination URL anytime without re-printing, and logs scan metrics like timestamps, location countries, and devices.
                          </div>
                        )}
                      </div>
                    </div>
                  </label>

                  {/* Checkbox 2: Track precise location */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={trackPreciseLocation}
                      onChange={(e) => setTrackPreciseLocation(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6] cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-[#334155] leading-snug">
                      <span>Track precise location</span>
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onMouseEnter={() => setActiveTooltip('location')}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={() => setActiveTooltip(activeTooltip === 'location' ? null : 'location')}
                          className="text-gray-400 hover:text-gray-600 align-middle"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                        {activeTooltip === 'location' && (
                          <div className="absolute left-6 top-0 z-50 w-64 p-2.5 bg-gray-900 text-white text-xs rounded-xl shadow-lg leading-relaxed">
                            Prompts the scanner's browser for GPS permission to record high-precision geographic coordinates (latitude, longitude, and city) in your scan analytics.
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                {/* Optional QR Name input */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">QR Code Label:</span>
                  <input
                    type="text"
                    value={qrName}
                    onChange={(e) => setQrName(e.target.value)}
                    placeholder="Website QR Code"
                    className="text-xs text-right font-medium text-gray-800 bg-transparent border-b border-gray-200 focus:border-[#3b82f6] outline-none px-1 py-0.5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 2: DESIGN, COLOR AND DECORATE QR CODE */}
          <div className="rounded-2xl border border-[#e2e8f0] overflow-hidden bg-white shadow-xs transition-all">
            {/* Accordion Header */}
            <div
              onClick={() => setDesignAccordionOpen(!designAccordionOpen)}
              className="flex items-center justify-between px-5 py-4 bg-[#f0f3ff] hover:bg-[#ebf0fe] cursor-pointer transition select-none"
            >
              <h3 className="text-base font-bold font-rubik text-[#1e293b]">
                Design, Color and Decorate QR Code
              </h3>
              <div className="w-7 h-7 rounded-full bg-white shadow-2xs border border-[#cbd5e1] flex items-center justify-center text-gray-700">
                {designAccordionOpen ? (
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
              </div>
            </div>

            {/* Accordion Body (Advanced Design Tools) */}
            {designAccordionOpen && (
              <div className="p-6 space-y-6">
                {/* 1. Frame / Sticker Preset Select */}
                <div>
                  <label className="block text-xs font-bold text-[#1e293b] mb-2.5">
                    Frame & Sticker Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'none', label: 'None (Standard)' },
                      { id: 'sticker-rainbow', label: 'Rainbow Scan Me' },
                      { id: 'sticker-badge-teal', label: 'Scan To Save' },
                      { id: 'sticker-circle-red', label: 'Circle Red' },
                      { id: 'frame-bottom-bar', label: 'Bottom Banner' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() =>
                          setDesign((prev) => ({
                            ...prev,
                            frame: {
                              ...prev.frame,
                              style: f.id as FrameStyle,
                              text: prev.frame?.text || 'SCAN ME'
                            }
                          }))
                        }
                        className={`p-2.5 rounded-xl border text-xs font-medium text-left transition cursor-pointer ${
                          (design.frame?.style || 'none') === f.id
                            ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#2563eb] font-bold ring-1 ring-[#3b82f6]'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Color Controls */}
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-xs font-bold text-[#1e293b] mb-2.5">
                    Colors & Contrast
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs text-gray-500 mb-1">Foreground QR Color</span>
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
                          className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-300"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs text-gray-500 mb-1">Background Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={design.backgroundColor === 'transparent' ? '#ffffff' : design.backgroundColor}
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
                          className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Dot Style Shapes */}
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-xs font-bold text-[#1e293b] mb-2.5">
                    QR Pattern Dot Style
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['square', 'rounded', 'dots', 'extra-rounded'] as DotStyle[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setDesign((prev) => ({ ...prev, dotStyle: st }))}
                        className={`py-2 px-1 rounded-xl border text-xs capitalize transition cursor-pointer ${
                          design.dotStyle === st
                            ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#2563eb] font-bold'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Corner Eye Shapes */}
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-xs font-bold text-[#1e293b] mb-2.5">
                    Corner Eyes
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['square', 'rounded', 'extra-rounded', 'circle'] as CornerSquareStyle[]).map((cs) => (
                      <button
                        key={cs}
                        type="button"
                        onClick={() => setDesign((prev) => ({ ...prev, cornerSquareStyle: cs }))}
                        className={`py-2 px-1 rounded-xl border text-xs capitalize transition cursor-pointer ${
                          design.cornerSquareStyle === cs
                            ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#2563eb] font-bold'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {cs}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Center Logo */}
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-xs font-bold text-[#1e293b] mb-2.5">
                    Center Logo / Icon
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="logo-upload-field"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setDesign((prev) => ({
                                ...prev,
                                logo: {
                                  ...prev.logo,
                                  url: reader.result as string
                                }
                              }));
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="logo-upload-field"
                      className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer transition shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Custom Logo</span>
                    </label>

                    {design.logo.url && (
                      <button
                        type="button"
                        onClick={() =>
                          setDesign((prev) => ({
                            ...prev,
                            logo: { ...prev.logo, url: null }
                          }))
                        }
                        className="text-xs text-red-500 hover:underline cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SAVE QR CODE BUTTON */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 px-6 bg-[#3b82f6] hover:bg-[#2563eb] active:scale-[0.99] text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(59,130,246,0.25)] transition cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Saving QR Code...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>QR Code Saved!</span>
              </>
            ) : (
              <>
                <span>Save QR Code</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>

          {/* Switch to Landing Page mode prompt */}
          {onSwitchToLanding && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onSwitchToLanding}
                className="text-xs text-[#64748b] hover:text-[#3b82f6] transition inline-flex items-center gap-1"
              >
                <span>Need a multi-link mobile bio landing page instead?</span>
                <span className="font-semibold underline">Switch to Landing Page mode &rarr;</span>
              </button>
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: QR PREVIEW & QUICK TABS ================= */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="bg-white rounded-3xl border border-[#e2e8f0] p-6 shadow-sm">
            {/* Live QR Code Preview Box with Transparency Checkerboard */}
            <div className="aspect-square w-full max-w-[280px] sm:max-w-[300px] mx-auto p-4 flex items-center justify-center bg-[radial-gradient(#e2e8f0_1.2px,transparent_1.2px)] [background-size:12px_12px] bg-slate-50/70 rounded-2xl border border-gray-200 shadow-inner">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain rounded-lg shadow-xs"
              />
            </div>

            {/* Quick Design Tabs */}
            <div className="flex items-center justify-around border-b border-gray-200 mt-5 pb-2.5">
              {(['STICKER', 'COLOR', 'SHAPES', 'LOGO'] as QuickTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveQuickTab(tab)}
                  className={`text-xs font-bold tracking-wider transition pb-1 border-b-2 cursor-pointer ${
                    activeQuickTab === tab
                      ? 'text-[#3b82f6] border-[#3b82f6]'
                      : 'text-[#64748b] border-transparent hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Quick Tab Content Area */}
            <div className="pt-4 min-h-[96px] flex items-center justify-center">
              {/* STICKER PRESETS (PIXEL PERFECT TO USER SCREENSHOT) */}
              {activeQuickTab === 'STICKER' && (
                <div className="flex items-center justify-center gap-4">
                  {/* Preset 1: Rainbow Scan Me */}
                  <button
                    type="button"
                    onClick={() =>
                      setDesign((prev) => ({
                        ...prev,
                        frame: { style: 'sticker-rainbow', text: 'SCAN ME' }
                      }))
                    }
                    className={`relative w-16 h-16 rounded-full border-2 transition transform hover:scale-105 cursor-pointer flex flex-col items-center justify-center p-1 bg-white shadow-xs ${
                      design.frame?.style === 'sticker-rainbow'
                        ? 'ring-2 ring-[#3b82f6] border-pink-500'
                        : 'border-pink-300 hover:border-pink-500'
                    }`}
                    title="Rainbow Ring Sticker"
                  >
                    <div className="w-13 h-13 rounded-full border-2 border-dashed border-pink-400 flex flex-col items-center justify-center text-[7px] font-black text-pink-600 leading-none">
                      <span>SCAN ME</span>
                      <span className="text-[10px] my-0.5">📱</span>
                      <span>SCAN ME</span>
                    </div>
                  </button>

                  {/* Preset 2: Teal Scan To Save */}
                  <button
                    type="button"
                    onClick={() =>
                      setDesign((prev) => ({
                        ...prev,
                        frame: { style: 'sticker-badge-teal', text: 'Scan To Save' }
                      }))
                    }
                    className={`relative w-15 h-16 rounded-xl border-2 transition transform hover:scale-105 cursor-pointer flex flex-col items-center justify-between p-1 bg-white shadow-xs ${
                      design.frame?.style === 'sticker-badge-teal'
                        ? 'ring-2 ring-[#3b82f6] border-teal-500'
                        : 'border-teal-300 hover:border-teal-500'
                    }`}
                    title="Scan To Save Teal Badge"
                  >
                    <div className="w-8 h-8 rounded border border-teal-300 flex items-center justify-center text-[9px] text-teal-600 mt-1">
                      QR
                    </div>
                    <div className="w-full bg-teal-600 text-white rounded text-[7px] font-bold py-0.5 text-center leading-none">
                      Scan To Save
                    </div>
                  </button>

                  {/* Preset 3: Red Circle Scan Me */}
                  <button
                    type="button"
                    onClick={() =>
                      setDesign((prev) => ({
                        ...prev,
                        frame: { style: 'sticker-circle-red', text: 'SCAN ME' }
                      }))
                    }
                    className={`relative w-16 h-16 rounded-full border-2 transition transform hover:scale-105 cursor-pointer flex flex-col items-center justify-center p-1 bg-white shadow-xs ${
                      design.frame?.style === 'sticker-circle-red'
                        ? 'ring-2 ring-[#3b82f6] border-red-500'
                        : 'border-red-300 hover:border-red-500'
                    }`}
                    title="Red Circular Sticker"
                  >
                    <div className="w-13 h-13 rounded-full bg-red-50 border border-red-400 flex flex-col items-center justify-center text-[7px] font-black text-red-600 leading-none">
                      <span>SCAN ME</span>
                      <span className="text-[10px] my-0.5">●</span>
                      <span>SCAN ME</span>
                    </div>
                  </button>

                  {/* Preset 4: Clean None */}
                  <button
                    type="button"
                    onClick={() =>
                      setDesign((prev) => ({
                        ...prev,
                        frame: { style: 'none' }
                      }))
                    }
                    className={`w-12 h-12 rounded-xl border-2 transition transform hover:scale-105 cursor-pointer flex flex-col items-center justify-center text-[10px] font-bold text-gray-500 hover:text-gray-800 ${
                      design.frame?.style === 'none' || !design.frame?.style
                        ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6]'
                        : 'border-gray-200'
                    }`}
                    title="Clean QR (No Sticker)"
                  >
                    None
                  </button>
                </div>
              )}

              {/* COLOR PRESETS */}
              {activeQuickTab === 'COLOR' && (
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {[
                    { color: '#0a0909', label: 'Black' },
                    { color: '#3b82f6', label: 'Blue' },
                    { color: '#0d9488', label: 'Teal' },
                    { color: '#ef4444', label: 'Red' },
                    { color: '#7c3aed', label: 'Purple' },
                    { color: '#f59e0b', label: 'Amber' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() =>
                        setDesign((prev) => ({
                          ...prev,
                          foregroundColor: c.color
                        }))
                      }
                      style={{ backgroundColor: c.color }}
                      className={`w-7 h-7 rounded-full transition transform hover:scale-110 shadow-xs cursor-pointer ${
                        design.foregroundColor === c.color ? 'ring-2 ring-offset-2 ring-[#3b82f6]' : ''
                      }`}
                      title={c.label}
                    />
                  ))}
                  <input
                    type="color"
                    value={design.foregroundColor}
                    onChange={(e) =>
                      setDesign((prev) => ({ ...prev, foregroundColor: e.target.value }))
                    }
                    className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer"
                    title="Custom Color"
                  />
                </div>
              )}

              {/* SHAPES PRESETS */}
              {activeQuickTab === 'SHAPES' && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {(['square', 'rounded', 'dots', 'extra-rounded'] as DotStyle[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDesign((prev) => ({ ...prev, dotStyle: st }))}
                      className={`px-3 py-1.5 rounded-lg border text-xs capitalize transition cursor-pointer ${
                        design.dotStyle === st
                          ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6] font-bold'
                          : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}

              {/* LOGO PRESETS */}
              {activeQuickTab === 'LOGO' && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setDesign((prev) => ({
                        ...prev,
                        logo: { ...prev.logo, url: null }
                      }))
                    }
                    className={`px-2.5 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                      !design.logo.url
                        ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6] font-bold'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    None
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDesign((prev) => ({
                        ...prev,
                        logo: {
                          ...prev.logo,
                          url: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png',
                          shape: 'circle'
                        }
                      }))
                    }
                    className="p-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition cursor-pointer text-gray-700"
                    title="Web Globe Icon"
                  >
                    <Globe className="w-5 h-5 text-[#3b82f6]" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDesign((prev) => ({
                        ...prev,
                        logo: {
                          ...prev.logo,
                          url: 'https://cdn-icons-png.flaticon.com/512/709/709496.png',
                          shape: 'circle'
                        }
                      }))
                    }
                    className="p-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition cursor-pointer text-gray-700"
                    title="Link Icon"
                  >
                    <Link2 className="w-5 h-5 text-indigo-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDesignAccordionOpen(true)}
                    className="text-xs text-[#3b82f6] font-semibold hover:underline cursor-pointer"
                  >
                    Upload...
                  </button>
                </div>
              )}
            </div>

            {/* Link: More QR Design Options >> (?) */}
            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={() => setDesignAccordionOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b82f6] hover:text-[#2563eb] hover:underline cursor-pointer"
              >
                <Palette className="w-4 h-4 text-[#3b82f6]" />
                <span>More QR Design Options &gt;&gt;</span>
                <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            {/* Quick Export / Download Action Bar */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleDownload('png')}
                className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload('svg')}
                className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1e293b] text-xs font-bold transition cursor-pointer"
              >
                <span>SVG</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload('pdf')}
                className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1e293b] text-xs font-bold transition cursor-pointer"
              >
                <span>PDF</span>
              </button>
            </div>

            {/* Destination URL preview & quick copy */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="font-mono text-[11px] truncate max-w-[200px]" title={destinationUrl}>
                {destinationUrl}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(destinationUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }
                }}
                className="text-[#3b82f6] font-bold hover:underline cursor-pointer"
              >
                {copiedLink ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
