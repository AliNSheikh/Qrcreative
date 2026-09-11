import React, { useState, useEffect, useRef } from 'react';
import {
  QRCodeRecord,
  QRCodeDesign,
  UserProfile,
  LandingPageData,
  PdfDocumentData
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
  FileText,
  Upload,
  Download,
  Share2,
  ExternalLink,
  Printer,
  Eye,
  Copy,
  Check,
  Minus,
  Plus,
  Sparkles,
  Palette,
  Layers,
  Smartphone,
  QrCode,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Info,
  Trash2,
  Globe,
  Sliders,
  Maximize2,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Building,
  User
} from 'lucide-react';

interface PdfQRCodeEditorProps {
  currentUser: UserProfile | null;
  onOpenAuth: (prompt?: string) => void;
  onQRSaved?: (qr: QRCodeRecord) => void;
  editingQR?: QRCodeRecord | null;
  onCancelEdit?: () => void;
}

type QuickTab = 'STICKER' | 'COLOR' | 'SHAPES' | 'LOGO';
type RightPreviewTab = 'qr' | 'pdf-preview';

interface PdfSamplePreset {
  id: string;
  name: string;
  title: string;
  company: string;
  description: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  sampleUrl: string;
  themeColor: string;
}

const PDF_PRESETS: PdfSamplePreset[] = [
  {
    id: 'corporate-profile',
    name: 'Corporate Profile',
    title: 'Enterprise Company Profile 2026',
    company: 'OmniTech Global Inc.',
    description: 'Executive summary, corporate governance, global delivery infrastructure, and technological innovation roadmap for 2026.',
    fileName: 'OmniTech_Corporate_Profile_2026.pdf',
    fileSize: '2.8 MB',
    pageCount: 6,
    sampleUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    themeColor: '#2563eb'
  },
  {
    id: 'product-catalog',
    name: 'Product Catalog',
    title: 'Architectural Lighting & Fixtures Catalog',
    company: 'Lumina Design Studio',
    description: 'Complete collection of contemporary architectural lighting, photometric specifications, and commercial finish options.',
    fileName: 'Lumina_Product_Catalog_2026.pdf',
    fileSize: '4.5 MB',
    pageCount: 8,
    sampleUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    themeColor: '#ea580c'
  },
  {
    id: 'restaurant-menu',
    name: 'Restaurant Menu',
    title: 'Spring Culinary & Artisan Cocktails Menu',
    company: 'The Botanical Garden Bistro',
    description: 'Seasonal farm-to-table lunch & dinner selections, craft cocktails, biodynamic wines, and signature dessert pairings.',
    fileName: 'Botanical_Bistro_Spring_Menu.pdf',
    fileSize: '1.9 MB',
    pageCount: 4,
    sampleUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    themeColor: '#059669'
  },
  {
    id: 'research-whitepaper',
    name: 'Whitepaper',
    title: 'Next-Generation AI in Enterprise Commerce',
    company: 'Apex Research Institute',
    description: 'In-depth empirical research on AI-driven customer personalization, conversion optimization, and predictive inventory systems.',
    fileName: 'Apex_AI_Commerce_Whitepaper.pdf',
    fileSize: '3.4 MB',
    pageCount: 12,
    sampleUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    themeColor: '#7c3aed'
  }
];

export const PdfQRCodeEditor: React.FC<PdfQRCodeEditorProps> = ({
  currentUser,
  onOpenAuth,
  onQRSaved,
  editingQR = null,
  onCancelEdit
}) => {
  // 1. PDF Content States
  const initialPdf = editingQR?.landing_page?.pdfDocument || (editingQR?.content as any);

  const [documentTitle, setDocumentTitle] = useState<string>(
    initialPdf?.title || editingQR?.landing_page?.title || initialPdf?.fileName?.replace(/\.pdf$/i, '') || 'Enterprise Company Profile 2026'
  );
  const [companyName, setCompanyName] = useState<string>(
    initialPdf?.companyName || editingQR?.landing_page?.company || 'OmniTech Global Inc.'
  );
  const [description, setDescription] = useState<string>(
    initialPdf?.description || editingQR?.landing_page?.bio || 'Executive summary, corporate governance, global delivery infrastructure, and technological innovation roadmap for 2026.'
  );
  const [fileName, setFileName] = useState<string>(
    initialPdf?.fileName || 'OmniTech_Corporate_Profile_2026.pdf'
  );
  const [fileSize, setFileSize] = useState<string>(
    initialPdf?.fileSize || '2.8 MB'
  );
  const [pageCount, setPageCount] = useState<number>(
    initialPdf?.pageCount || 6
  );
  const [pdfFileUrl, setPdfFileUrl] = useState<string>(
    initialPdf?.fileUrl || editingQR?.destination_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  );
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);

  // Options
  const [enableDownload, setEnableDownload] = useState<boolean>(
    initialPdf?.enableDownload !== false
  );
  const [enablePrint, setEnablePrint] = useState<boolean>(
    initialPdf?.enablePrint !== false
  );
  const [autoDownload, setAutoDownload] = useState<boolean>(
    Boolean(initialPdf?.autoDownload)
  );

  // Mode & tracking
  const [isDynamic, setIsDynamic] = useState<boolean>(() => {
    if (editingQR) return editingQR.mode === 'editable';
    return true; // Dynamic by default
  });
  const [trackPreciseLocation, setTrackPreciseLocation] = useState<boolean>(false);
  const [qrName, setQrName] = useState<string>(
    editingQR?.name || `${documentTitle} QR`
  );

  // Accordion states
  const [basicInfoOpen, setBasicInfoOpen] = useState(true);
  const [designAccordionOpen, setDesignAccordionOpen] = useState(false);

  // Right Column Preview Switcher
  const [previewTab, setPreviewTab] = useState<RightPreviewTab>('qr');
  const [activeQuickTab, setActiveQuickTab] = useState<QuickTab>('STICKER');

  // Slug for landing page
  const [slug] = useState<string>(() => {
    if (editingQR?.slug) return editingQR.slug;
    return `pdf-${Math.random().toString(36).substring(2, 8)}`;
  });

  // Target landing page URL (The QR code opens this URL!)
  const publicLandingUrl = getLandingPageUrl(slug);
  const qrEncodedText = isDynamic ? publicLandingUrl : (pdfFileUrl || publicLandingUrl);

  // 2. QR Design State
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
        color2: '#2563eb',
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
        label: 'VIEW PDF',
        color: '#dc2626',
        textColor: '#ffffff'
      },
      margin: 3,
      errorCorrectionLevel: 'M'
    };
  });

  // 3. Canvas & UI Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Simulated PDF Viewer state in preview
  const [previewPage, setPreviewPage] = useState(1);
  const [previewZoom, setPreviewZoom] = useState(100);

  // Render QR Canvas whenever design or encoded text changes
  useEffect(() => {
    let active = true;
    async function draw() {
      if (!canvasRef.current) return;
      try {
        await renderQRToCanvas(canvasRef.current, qrEncodedText, design, 300);
      } catch (err) {
        console.error('Failed to render PDF QR code on canvas:', err);
      }
    }
    draw();
    return () => {
      active = false;
    };
  }, [qrEncodedText, design]);

  // Handle PDF File Upload
  const processPdfFile = (file: File) => {
    if (!file) return;
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileName(file.name);
    setFileSize(`${sizeInMb} MB`);
    const cleanTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    setDocumentTitle((prev) => (prev ? prev : cleanTitle));
    setQrName(`${cleanTitle} QR`);

    // Estimate page count based on file size or default
    const estPages = Math.max(1, Math.min(25, Math.round(file.size / 150000)));
    setPageCount(estPages);

    // Read as Data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedDataUrl(result);
      setPdfFileUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPdfFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      processPdfFile(file);
    }
  };

  // Handle Select Sample Preset
  const handleSelectPreset = (preset: PdfSamplePreset) => {
    setDocumentTitle(preset.title);
    setCompanyName(preset.company);
    setDescription(preset.description);
    setFileName(preset.fileName);
    setFileSize(preset.fileSize);
    setPageCount(preset.pageCount);
    setPdfFileUrl(preset.sampleUrl);
    setUploadedDataUrl(null);
    setQrName(`${preset.name} QR`);
    setPreviewPage(1);
  };

  // Handle Save QR Code
  const handleSave = async () => {
    if (!currentUser) {
      onOpenAuth('Please sign in to save your custom PDF QR code.');
      return;
    }

    setIsSaving(true);
    try {
      const pdfDocData: PdfDocumentData = {
        fileUrl: pdfFileUrl || uploadedDataUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileName: fileName || 'document.pdf',
        fileSize,
        pageCount,
        description,
        companyName,
        enableDownload,
        enablePrint,
        autoDownload,
        themeColor: '#2563eb'
      };

      const landingData: LandingPageData = {
        slug,
        title: documentTitle || 'PDF Document',
        bio: description || '',
        company: companyName,
        badge: 'Official PDF Document',
        pdfDocument: pdfDocData,
        links: [
          {
            id: 'lnk_pdf_dl',
            title: `Download ${fileName || 'PDF'}`,
            url: pdfDocData.fileUrl,
            description: `${fileSize} • ${pageCount} pages`,
            icon: 'file-text',
            isActive: true
          }
        ],
        socials: [],
        design: {
          theme: 'modern-blue',
          buttonStyle: 'rounded',
          buttonVariant: 'filled',
          primaryColor: '#2563eb',
          backgroundColor: '#ffffff',
          textColor: '#0a0909',
          fontFamily: 'Rubik',
          avatarShape: 'rounded',
          layoutTemplate: 'minimal'
        }
      };

      const saved = await saveQRCode({
        id: editingQR?.id,
        user_id: currentUser.id,
        name: qrName.trim() || `${documentTitle} QR`,
        type: 'pdf',
        mode: isDynamic ? 'editable' : 'static',
        slug: isDynamic ? slug : undefined,
        destination_url: publicLandingUrl,
        landing_page: landingData,
        content: {
          url: publicLandingUrl,
          fileName,
          fileSize,
          pageCount,
          fileUrl: pdfDocData.fileUrl,
          title: documentTitle,
          company: companyName,
          trackPreciseLocation
        },
        design,
        is_active: true
      });

      setSaveSuccess(true);
      if (onQRSaved) {
        onQRSaved(saved);
      }
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Error saving PDF QR code:', err);
      alert('Failed to save QR Code. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Download (PNG, SVG, PDF print)
  const handleDownload = (format: 'png' | 'svg' | 'pdf') => {
    if (!canvasRef.current) return;
    const cleanName = (qrName || 'pdf-qr').toLowerCase().replace(/\s+/g, '-');
    const outFileName = `${cleanName}.${format}`;

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = outFileName;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    } else if (format === 'svg') {
      const svgString = generateQRSVG(qrEncodedText, design, 800);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const link = document.createElement('a');
      link.download = outFileName;
      link.href = URL.createObjectURL(blob);
      link.click();
    } else if (format === 'pdf') {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head><title>${qrName} - PDF Print Preview</title></head>
            <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
              <h2 style="margin-bottom:6px;">${documentTitle}</h2>
              <p style="color:#64748b;font-size:12px;margin-top:0;">Scan to view and download PDF: ${publicLandingUrl}</p>
              <img src="${dataUrl}" style="width:300px;height:300px;" />
              <script>window.onload = function() { window.print(); }</script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLandingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. TOP BAR: Title & Mode */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-[#e3e5ed] p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                PDF Document QR
              </span>
              <span className="text-xs text-[#84868e] flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                Scans open PDF Viewer Landing Page
              </span>
            </div>
            <input
              type="text"
              value={qrName}
              onChange={(e) => setQrName(e.target.value)}
              placeholder="QR Code Name (e.g. Company Brochure)"
              className="mt-1 text-base sm:text-lg font-bold font-rubik text-[#0a0909] bg-transparent border-b border-dashed border-gray-300 hover:border-[#2563eb] focus:border-[#2563eb] outline-none transition"
            />
          </div>
        </div>

        {/* Dynamic / Static Toggle */}
        <div className="flex items-center gap-2 bg-[#f5f7fc] p-1.5 rounded-xl border border-[#e3e5ed]">
          <button
            type="button"
            onClick={() => setIsDynamic(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              isDynamic ? 'bg-white text-[#2563eb] shadow-xs' : 'text-gray-600 hover:text-[#0a0909]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dynamic (Editable & Tracked)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDynamic(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              !isDynamic ? 'bg-white text-[#0a0909] shadow-xs' : 'text-gray-600 hover:text-[#0a0909]'
            }`}
          >
            <span>Static</span>
          </button>
        </div>
      </div>

      {/* 2. SPLIT WORKSPACE: LEFT EDITOR & RIGHT PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN: ACCORDIONS ================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* ACCORDION 1: BASIC INFORMATION */}
          <div className="bg-white rounded-2xl border border-[#e3e5ed] overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setBasicInfoOpen(!basicInfoOpen)}
              className="w-full flex items-center justify-between px-5 py-4 bg-[#f5f7fc] hover:bg-[#edf1fc] transition text-left cursor-pointer border-b border-[#e3e5ed]"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span className="font-bold font-rubik text-sm text-[#0a0909]">
                  Basic Information & PDF File
                </span>
              </div>
              <div className="w-6 h-6 rounded-full bg-white border border-[#e3e5ed] flex items-center justify-center text-gray-600">
                {basicInfoOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </div>
            </button>

            {basicInfoOpen && (
              <div className="p-5 space-y-6">
                {/* 1A. PDF Upload Dropzone */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#0a0909] flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-red-500" />
                      <span>Upload PDF Document</span>
                    </label>
                    <span className="text-[11px] text-[#84868e]">Supports .pdf up to 50MB</span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                      isDragging
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-gray-300 hover:border-red-400 bg-gray-50/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-xs">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#0a0909] block">
                        Drag and drop your PDF here, or <span className="text-red-600 underline">browse</span>
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5 block">
                        Current File: <strong className="text-gray-900 font-semibold">{fileName}</strong> ({fileSize} • {pageCount} pages)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1B. Quick Presets Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Or Try a Sample Template
                    </span>
                    <span className="text-[11px] text-gray-400">Click to instantly populate</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PDF_PRESETS.map((p) => {
                      const isActive = documentTitle === p.title;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPreset(p)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            isActive
                              ? 'border-red-500 bg-red-50/40 ring-1 ring-red-500'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-[10px] font-bold text-red-600 uppercase">
                              PDF
                            </span>
                            {isActive && <Check className="w-3.5 h-3.5 text-red-600" />}
                          </div>
                          <span className="text-xs font-bold text-[#0a0909] line-clamp-1">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5">
                            {p.pageCount} Pages • {p.fileSize}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1C. Document Details Inputs */}
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  {/* Document Title */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0a0909] mb-1">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      placeholder="e.g. Global Tech Enterprise Profile 2026"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#2563eb] text-sm text-[#0a0909] outline-none transition"
                    />
                  </div>

                  {/* Company & File details row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#0a0909] mb-1">
                        Company or Author Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. OmniTech Global Inc."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#2563eb] text-sm text-[#0a0909] outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0a0909] mb-1">
                        Page Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={pageCount}
                        onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#2563eb] text-sm text-[#0a0909] outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0a0909] mb-1">
                      Document Description / Summary
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Short summary displayed on the landing page viewer..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#2563eb] text-sm text-[#0a0909] outline-none transition resize-y"
                    />
                  </div>

                  {/* External URL Override (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0a0909] mb-1">
                      Direct PDF URL <span className="text-gray-400 font-normal">(Optional Cloud Storage Link)</span>
                    </label>
                    <input
                      type="url"
                      value={pdfFileUrl}
                      onChange={(e) => setPdfFileUrl(e.target.value)}
                      placeholder="https://example.com/document.pdf"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#2563eb] text-xs text-[#0a0909] outline-none transition"
                    />
                  </div>
                </div>

                {/* 1D. Viewer Features Toggles */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <span className="text-xs font-bold text-gray-700 block uppercase tracking-wider">
                    Landing Page Viewer Features
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-[#f5f7fc] rounded-xl border border-[#e3e5ed]">
                      <div>
                        <span className="text-xs font-bold text-[#0a0909] block">Enable Download Button</span>
                        <span className="text-[10px] text-gray-500">Allow users to save .pdf directly</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnableDownload(!enableDownload)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          enableDownload ? 'bg-[#2563eb]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            enableDownload ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#f5f7fc] rounded-xl border border-[#e3e5ed]">
                      <div>
                        <span className="text-xs font-bold text-[#0a0909] block">Enable Print & Share</span>
                        <span className="text-[10px] text-gray-500">Show print and share toolbar tools</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnablePrint(!enablePrint)}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          enablePrint ? 'bg-[#2563eb]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            enablePrint ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 2: DESIGN & DECORATE QR */}
          <div className="bg-white rounded-2xl border border-[#e3e5ed] overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setDesignAccordionOpen(!designAccordionOpen)}
              className="w-full flex items-center justify-between px-5 py-4 bg-[#f5f7fc] hover:bg-[#edf1fc] transition text-left cursor-pointer border-b border-[#e3e5ed]"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span className="font-bold font-rubik text-sm text-[#0a0909]">
                  Design & Decorate QR
                </span>
              </div>
              <div className="w-6 h-6 rounded-full bg-white border border-[#e3e5ed] flex items-center justify-center text-gray-600">
                {designAccordionOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </div>
            </button>

            {designAccordionOpen && (
              <div className="p-5 space-y-6">
                {/* 2A. Design Templates */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Template Presets
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {Object.entries(DESIGN_TEMPLATES).map(([key, tmpl]) => {
                      const isSelected = design.template === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setDesign((prev) => ({
                              ...prev,
                              template: key,
                              dotStyle: tmpl.dotStyle || 'square',
                              cornerSquareStyle: tmpl.cornerSquareStyle || 'square',
                              cornerDotStyle: tmpl.cornerDotStyle || 'square',
                              foregroundColor: tmpl.foregroundColor || '#000000',
                              backgroundColor: tmpl.backgroundColor || '#ffffff',
                              gradient: {
                                ...prev.gradient,
                                enabled: Boolean(tmpl.gradient?.enabled),
                                ...(tmpl.gradient || {})
                              }
                            }));
                          }}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? 'border-[#2563eb] bg-[#2563eb]/5 ring-2 ring-[#2563eb]/20'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div
                            className="w-full h-8 rounded-lg mb-2 flex items-center justify-center font-black text-xs uppercase"
                            style={{
                              backgroundColor: tmpl.backgroundColor || '#ffffff',
                              color: tmpl.foregroundColor || '#000000',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            {key}
                          </div>
                          <span className="text-xs font-bold text-[#0a0909] block truncate capitalize">
                            {key}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2B. Stickers & Frames */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    Stickers & Frame Style
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'simple-bottom', label: 'Bottom Bar' },
                      { id: 'rounded-bottom', label: 'Pill Bottom' },
                      { id: 'top-banner', label: 'Top Banner' },
                      { id: 'badge', label: 'Badge' },
                      { id: 'modern-pill', label: 'Modern Pill' }
                    ].map((frame) => {
                      const active = (design.frame?.style || 'none') === frame.id;
                      return (
                        <button
                          key={frame.id}
                          type="button"
                          onClick={() =>
                            setDesign((prev) => ({
                              ...prev,
                              frame: {
                                ...(prev.frame || { label: 'VIEW PDF', color: '#dc2626', textColor: '#ffffff' }),
                                style: frame.id as any
                              }
                            }))
                          }
                          className={`p-2.5 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                            active
                              ? 'border-red-600 bg-red-50 text-red-600 ring-2 ring-red-600/20'
                              : 'border-gray-200 hover:border-gray-300 text-[#0a0909] bg-white'
                          }`}
                        >
                          {frame.label}
                        </button>
                      );
                    })}
                  </div>

                  {design.frame?.style && design.frame.style !== 'none' && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Frame Label</label>
                        <input
                          type="text"
                          value={design.frame.label || 'VIEW PDF'}
                          onChange={(e) =>
                            setDesign((prev) => ({
                              ...prev,
                              frame: {
                                ...(prev.frame || { style: 'simple-bottom', color: '#dc2626', textColor: '#ffffff' }),
                                label: e.target.value
                              }
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-[#e3e5ed] text-xs font-semibold text-[#0a0909] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1">Frame Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={design.frame.color || '#dc2626'}
                            onChange={(e) =>
                              setDesign((prev) => ({
                                ...prev,
                                frame: {
                                  ...(prev.frame || { style: 'simple-bottom', label: 'VIEW PDF', textColor: '#ffffff' }),
                                  color: e.target.value
                                }
                              }))
                            }
                            className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={design.frame.color || '#dc2626'}
                            onChange={(e) =>
                              setDesign((prev) => ({
                                ...prev,
                                frame: {
                                  ...(prev.frame || { style: 'simple-bottom', label: 'VIEW PDF', textColor: '#ffffff' }),
                                  color: e.target.value
                                }
                              }))
                            }
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#e3e5ed] text-xs font-mono text-[#0a0909] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2C. Colors & Gradients */}
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    QR Pattern Colors
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[11px] text-gray-500 block mb-1">Foreground Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={design.foregroundColor}
                          onChange={(e) =>
                            setDesign((prev) => ({ ...prev, foregroundColor: e.target.value }))
                          }
                          className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={design.foregroundColor}
                          onChange={(e) =>
                            setDesign((prev) => ({ ...prev, foregroundColor: e.target.value }))
                          }
                          className="flex-1 px-3 py-1.5 rounded-lg border border-[#e3e5ed] text-xs font-mono text-[#0a0909] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-500 block mb-1">Background Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={design.backgroundColor}
                          onChange={(e) =>
                            setDesign((prev) => ({ ...prev, backgroundColor: e.target.value }))
                          }
                          className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={design.backgroundColor}
                          onChange={(e) =>
                            setDesign((prev) => ({ ...prev, backgroundColor: e.target.value }))
                          }
                          className="flex-1 px-3 py-1.5 rounded-lg border border-[#e3e5ed] text-xs font-mono text-[#0a0909] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2D. Dot & Corner Shapes */}
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Dot & Corner Shapes
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'square', label: 'Square' },
                      { id: 'dots', label: 'Dots' },
                      { id: 'rounded', label: 'Rounded' },
                      { id: 'classy', label: 'Classy' }
                    ].map((shape) => {
                      const active = design.dotStyle === shape.id;
                      return (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => setDesign((prev) => ({ ...prev, dotStyle: shape.id as any }))}
                          className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            active
                              ? 'border-[#2563eb] bg-[#2563eb]/10 text-[#2563eb]'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                          }`}
                        >
                          {shape.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2E. Center Logo / PDF Badge */}
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Center Logo / Icon
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setDesign((prev) => ({
                          ...prev,
                          logo: {
                            url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="%23dc2626"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8" fill="%23ffffff"/><text x="7" y="18" fill="%23ffffff" font-size="6" font-family="sans-serif" font-weight="bold">PDF</text></svg>',
                            size: 22,
                            padding: 4,
                            shape: 'square'
                          }
                        }))
                      }
                      className="px-3 py-2 rounded-xl border border-gray-200 hover:border-red-500 text-xs font-bold text-[#0a0909] flex items-center gap-2 bg-white"
                    >
                      <div className="w-5 h-5 rounded bg-red-600 text-white flex items-center justify-center text-[8px] font-bold">
                        PDF
                      </div>
                      <span>Add PDF Badge</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDesign((prev) => ({
                          ...prev,
                          logo: { url: null, size: 20, padding: 4, shape: 'square' }
                        }))
                      }
                      className="px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 text-xs text-gray-500 bg-white"
                    >
                      Remove Logo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: PREVIEW WORKSPACE ================= */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <div className="bg-white rounded-2xl border border-[#e3e5ed] p-5 shadow-sm">
            {/* Right Preview Switcher Tabs */}
            <div className="flex items-center justify-between p-1 bg-[#f5f7fc] rounded-xl border border-[#e3e5ed] mb-4">
              <button
                type="button"
                onClick={() => setPreviewTab('qr')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  previewTab === 'qr'
                    ? 'bg-white text-[#2563eb] shadow-xs'
                    : 'text-gray-600 hover:text-[#0a0909]'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('pdf-preview')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  previewTab === 'pdf-preview'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-gray-600 hover:text-[#0a0909]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>PDF Landing Viewer</span>
              </button>
            </div>

            {/* TAB 1: QR CODE VIEW */}
            {previewTab === 'qr' && (
              <div className="space-y-4">
                {/* QR Canvas Display */}
                <div className="w-full aspect-square max-w-[300px] mx-auto bg-white rounded-2xl border border-gray-100 shadow-xs flex items-center justify-center p-4">
                  <canvas ref={canvasRef} className="max-w-full h-auto drop-shadow-xs" />
                </div>

                <div className="text-center">
                  <span className="text-xs font-bold text-[#0a0909] block truncate">
                    {documentTitle}
                  </span>
                  <span className="text-[11px] text-gray-500 mt-0.5 block truncate">
                    {publicLandingUrl}
                  </span>
                </div>

                {/* Quick Style Sub-Tabs (Sticker / Color / Shapes / Logo) */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-around mb-3">
                    {(['STICKER', 'COLOR', 'SHAPES', 'LOGO'] as QuickTab[]).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveQuickTab(tab)}
                        className={`text-[11px] font-bold pb-1 transition border-b-2 cursor-pointer ${
                          activeQuickTab === tab
                            ? 'border-[#2563eb] text-[#2563eb]'
                            : 'border-transparent text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {activeQuickTab === 'STICKER' && (
                    <div className="flex items-center justify-center gap-2">
                      {['none', 'simple-bottom', 'rounded-bottom', 'badge'].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() =>
                            setDesign((prev) => ({
                              ...prev,
                              frame: {
                                ...(prev.frame || { label: 'VIEW PDF', color: '#dc2626', textColor: '#ffffff' }),
                                style: f as any
                              }
                            }))
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                            (design.frame?.style || 'none') === f
                              ? 'bg-red-50 text-red-600 border-red-500'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {f === 'none' ? 'None' : f.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeQuickTab === 'COLOR' && (
                    <div className="flex items-center justify-center gap-2">
                      {['#0a0909', '#dc2626', '#2563eb', '#059669', '#7c3aed'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDesign((prev) => ({ ...prev, foregroundColor: c }))}
                          className="w-7 h-7 rounded-full border border-gray-300 transition transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  )}

                  {activeQuickTab === 'SHAPES' && (
                    <div className="flex items-center justify-center gap-2">
                      {['square', 'dots', 'rounded', 'classy'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setDesign((prev) => ({ ...prev, dotStyle: s as any }))}
                          className={`px-2.5 py-1 rounded-lg text-xs capitalize border ${
                            design.dotStyle === s
                              ? 'bg-blue-50 text-blue-600 border-blue-500 font-bold'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeQuickTab === 'LOGO' && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDesign((prev) => ({
                            ...prev,
                            logo: {
                              url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="%23dc2626"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8" fill="%23ffffff"/><text x="7" y="18" fill="%23ffffff" font-size="6" font-family="sans-serif" font-weight="bold">PDF</text></svg>',
                              size: 22,
                              padding: 4,
                              shape: 'square'
                            }
                          }))
                        }
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200"
                      >
                        PDF Icon
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDesign((prev) => ({
                            ...prev,
                            logo: { url: null, size: 20, padding: 4, shape: 'square' }
                          }))
                        }
                        className="px-3 py-1 rounded-lg text-xs text-gray-500 border border-gray-200"
                      >
                        No Icon
                      </button>
                    </div>
                  )}
                </div>

                {/* Download Formats (PNG, SVG, PDF) */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleDownload('png')}
                    className="py-2 px-3 rounded-xl border border-gray-200 hover:border-gray-400 text-xs font-bold text-[#0a0909] bg-white transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload('svg')}
                    className="py-2 px-3 rounded-xl border border-gray-200 hover:border-gray-400 text-xs font-bold text-[#0a0909] bg-white transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>SVG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload('pdf')}
                    className="py-2 px-3 rounded-xl border border-gray-200 hover:border-gray-400 text-xs font-bold text-[#0a0909] bg-white transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE SMARTPHONE PDF VIEWER PREVIEW */}
            {previewTab === 'pdf-preview' && (
              <div className="space-y-3">
                {/* Smartphone Mockup */}
                <div className="relative mx-auto w-full max-w-[280px] h-[520px] bg-[#0a0909] rounded-[38px] p-2.5 shadow-xl border-4 border-[#26262b] flex flex-col justify-between overflow-hidden">
                  {/* Speaker & Dynamic Island */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-black rounded-full z-30 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#1c1c1e] mr-1.5" />
                    <div className="w-6 h-1 rounded-full bg-[#1c1c1e]" />
                  </div>

                  {/* Inside Screen Content */}
                  <div className="w-full h-full rounded-[28px] bg-white flex flex-col overflow-hidden text-left relative pt-6 select-none">
                    {/* Header Bar */}
                    <div className="p-3 bg-[#181920] text-white flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                          PDF
                        </div>
                        <div className="truncate">
                          <span className="text-[11px] font-bold block truncate text-white leading-tight">
                            {fileName}
                          </span>
                          <span className="text-[9px] text-gray-400 block leading-tight">
                            {fileSize} • {pageCount} Pages
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px]">
                          <Share2 className="w-3 h-3" />
                        </span>
                      </div>
                    </div>

                    {/* PDF Reader Toolbar */}
                    <div className="px-3 py-1.5 bg-[#f5f7fc] border-b border-gray-200 flex items-center justify-between text-[11px] text-gray-600">
                      <div className="flex items-center gap-1 font-semibold">
                        <button
                          type="button"
                          onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                          className="p-1 hover:text-black"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span>
                          {previewPage} / {pageCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewPage((p) => Math.min(pageCount, p + 1))}
                          className="p-1 hover:text-black"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewZoom((z) => Math.max(75, z - 15))}
                          className="p-1 hover:text-black"
                        >
                          <ZoomOut className="w-3 h-3" />
                        </button>
                        <span className="text-[10px]">{previewZoom}%</span>
                        <button
                          type="button"
                          onClick={() => setPreviewZoom((z) => Math.min(150, z + 15))}
                          className="p-1 hover:text-black"
                        >
                          <ZoomIn className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Rendered Document Page Simulation */}
                    <div className="flex-1 bg-gray-100 p-2.5 overflow-y-auto flex flex-col items-center">
                      <div
                        className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-3 min-h-[300px] flex flex-col justify-between transition-transform duration-150"
                        style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}
                      >
                        <div>
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                            <span className="text-[9px] font-bold text-red-600 tracking-wider uppercase">
                              {companyName}
                            </span>
                            <span className="text-[8px] text-gray-400">Page {previewPage}</span>
                          </div>

                          <h4 className="text-xs font-bold font-rubik text-gray-900 leading-snug">
                            {documentTitle}
                          </h4>

                          <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">
                            {description || 'Document content and overview summary provided in full resolution view.'}
                          </p>

                          <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-100 space-y-1">
                            <div className="h-1.5 bg-gray-200 rounded w-full" />
                            <div className="h-1.5 bg-gray-200 rounded w-4/5" />
                            <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                            <div className="h-1.5 bg-gray-200 rounded w-5/6" />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 text-center">
                          <span className="text-[8px] text-gray-400">
                            End of Page {previewPage} • {fileName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Mobile Action Bar */}
                    <div className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = pdfFileUrl;
                          a.download = fileName;
                          a.target = '_blank';
                          a.click();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-[11px] text-gray-500">
                    Live preview of the mobile-responsive PDF viewer
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Actions: Copy Link & Save QR Code */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-3 rounded-xl border border-[#e3e5ed] hover:bg-gray-50 text-xs font-bold text-[#0a0909] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-green-600">Landing Page Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Copy PDF Landing Page Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3.5 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-300" />
                    <span>Saved Successfully!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{editingQR ? 'Update PDF QR Code' : 'Save & Download QR Code'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
