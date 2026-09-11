import React, { useState, useEffect } from 'react';
import { QRCodeRecord, LandingPageData, PdfDocumentData } from '../../types';
import {
  FileText,
  Download,
  Share2,
  ExternalLink,
  Printer,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Check,
  Building,
  Info,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';

interface PdfViewerLandingViewProps {
  qr: QRCodeRecord;
  landingData: LandingPageData;
  themeStyle: any;
  onShare: () => void;
  copied: boolean;
}

export const PdfViewerLandingView: React.FC<PdfViewerLandingViewProps> = ({
  qr,
  landingData,
  themeStyle,
  onShare,
  copied
}) => {
  const pdfDoc: PdfDocumentData = landingData.pdfDocument || {
    fileUrl: qr.destination_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: (qr.content?.fileName as string) || `${landingData.title || 'document'}.pdf`,
    fileSize: (qr.content?.fileSize as string) || '2.5 MB',
    pageCount: (qr.content?.pageCount as number) || 6,
    description: landingData.bio || 'Official document provided for direct viewing and download.',
    companyName: landingData.company || 'Enterprise Document',
    enableDownload: true,
    enablePrint: true,
    autoDownload: false
  };

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showDocInfo, setShowDocInfo] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const totalPages = Math.max(1, pdfDoc.pageCount || 6);

  // Auto-download on load if enabled
  useEffect(() => {
    if (pdfDoc.autoDownload && pdfDoc.fileUrl) {
      handleDownload();
    }
  }, []);

  // Handle Download
  const handleDownload = () => {
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = pdfDoc.fileUrl;
      link.download = pdfDoc.fileName || 'document.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to trigger download:', err);
      window.open(pdfDoc.fileUrl, '_blank');
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Handle Open in New Tab
  const handleOpenNewTab = () => {
    window.open(pdfDoc.fileUrl, '_blank');
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(175, prev + 15));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(65, prev - 15));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  // Sample page content generator for simulated high-fidelity document reader
  const renderPageContent = (page: number) => {
    if (page === 1) {
      return (
        <div className="space-y-4">
          <div className="border-b-2 border-red-600 pb-3">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block">
              {pdfDoc.companyName || 'Corporate Document'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-rubik text-gray-950 mt-1 leading-tight">
              {landingData.title || pdfDoc.fileName.replace(/\.pdf$/i, '')}
            </h1>
            <span className="text-xs text-gray-500 mt-1 block">
              Executive Release • Publication Edition
            </span>
          </div>

          <div className="bg-red-50/70 border-l-4 border-red-600 p-3 rounded-r-lg">
            <span className="text-xs font-bold text-red-900 block mb-1">Executive Summary</span>
            <p className="text-xs text-red-950 leading-relaxed">
              {pdfDoc.description || landingData.bio || 'This document contains strategic operational guidelines, market analysis, and product specifications.'}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-gray-900">Key Document Highlights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[11px] font-bold text-gray-800 block">Verified Publication</span>
                <p className="text-[11px] text-gray-500 mt-0.5">Authorised by {pdfDoc.companyName}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[11px] font-bold text-gray-800 block">Complete Dataset</span>
                <p className="text-[11px] text-gray-500 mt-0.5">{pdfDoc.pageCount} Pages • High Resolution</p>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <h4 className="text-xs font-bold text-gray-900 mb-2">Section Index</h4>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span>1. Strategic Mission & Company Governance</span>
                <span className="font-mono text-gray-400">Page 1-2</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span>2. Technical Specifications & Architecture</span>
                <span className="font-mono text-gray-400">Page 3-4</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span>3. Operational Roadmap & Commercials</span>
                <span className="font-mono text-gray-400">Page 5-6</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            {pdfDoc.companyName} • Section {page}
          </span>
          <span className="text-xs font-mono font-semibold text-gray-400">Page {page} of {totalPages}</span>
        </div>

        <h2 className="text-base sm:text-lg font-bold font-rubik text-gray-900">
          Chapter {page}: Operational Analysis & Detailed Specifications
        </h2>

        <p className="text-xs text-gray-700 leading-relaxed">
          Comprehensive analysis outlining technical workflows, service level benchmarks, and structural frameworks. Continuous evaluation metrics demonstrate performance optimization across verified industry metrics.
        </p>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 my-4">
          <div className="flex items-center justify-between text-xs font-bold text-gray-800">
            <span>Metric Indicator</span>
            <span>Target Benchmark</span>
          </div>
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${60 + (page * 5)}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>Evaluation Criteria {page}.0</span>
            <span>Verified (99.{page}%)</span>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Data integrity protocols ensure cross-platform compliance and audit readiness. For complete tabular dataset and appendices, consult the downloadable original PDF document file.
        </p>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* 1. TOP NAV / HEADER BAR */}
      <div className="w-full bg-[#181920] text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-white/10 mb-4 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Document Title & Badge */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black font-rubik truncate text-white tracking-tight">
                  {landingData.title || pdfDoc.fileName}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold tracking-wider uppercase">
                  <ShieldCheck className="w-3 h-3" />
                  PDF
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span className="truncate">{pdfDoc.companyName}</span>
                <span>•</span>
                <span>{pdfDoc.fileSize}</span>
                <span>•</span>
                <span>{totalPages} Pages</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions: Download, Open, Share */}
          <div className="flex items-center gap-2">
            {pdfDoc.enableDownload !== false && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {downloading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : downloadSuccess ? (
                  <Check className="w-4 h-4 text-green-300" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {downloadSuccess ? 'Downloaded!' : 'Download PDF'}
                </span>
                <span className="sm:hidden">Download</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Open PDF in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {pdfDoc.enablePrint !== false && (
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:flex p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Print document"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onShare}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Share document link"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. VIEWER TOOLBAR */}
      <div className="w-full bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-2xl p-3 shadow-xs mb-3 flex flex-wrap items-center justify-between gap-3">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-100">
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= totalPages) setCurrentPage(val);
              }}
              className="w-10 px-1.5 py-0.5 rounded border border-gray-300 dark:border-white/20 text-center text-xs font-mono font-bold bg-gray-50 dark:bg-black/30"
            />
            <span className="text-gray-400">/ {totalPages}</span>
          </div>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls & View options */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 text-xs font-mono font-bold text-gray-800 dark:text-gray-200"
              title="Reset Zoom"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowDocInfo(!showDocInfo)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              showDocInfo
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
            }`}
            title="Toggle document information"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. OPTIONAL DOCUMENT INFO DRAWER */}
      {showDocInfo && (
        <div className="w-full bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-4 mb-3 text-xs text-blue-900 dark:text-blue-200 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-blue-950 dark:text-blue-100">
              <Info className="w-4 h-4 text-blue-600" />
              Document Properties & Metadata
            </span>
            <button
              type="button"
              onClick={() => setShowDocInfo(false)}
              className="text-blue-600 hover:text-blue-800 font-bold"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-blue-900/80 leading-relaxed">
            {pdfDoc.description || landingData.bio}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
            <div>
              <span className="text-gray-500 block">File Name</span>
              <span className="font-bold truncate block">{pdfDoc.fileName}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Size</span>
              <span className="font-bold">{pdfDoc.fileSize}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Pages</span>
              <span className="font-bold">{totalPages}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Company</span>
              <span className="font-bold truncate block">{pdfDoc.companyName}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN PDF CANVAS / DOCUMENT READER CONTAINER */}
      <div
        className={`w-full bg-neutral-200 dark:bg-[#121214] rounded-3xl border border-gray-300 dark:border-white/10 shadow-inner overflow-hidden flex flex-col items-center justify-start p-4 sm:p-8 min-h-[550px] transition-all relative ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none p-6' : ''
        }`}
      >
        {/* If valid PDF URL and not in data URL format, attempt embedding */}
        {pdfDoc.fileUrl && !pdfDoc.fileUrl.startsWith('data:') && (
          <div className="w-full mb-4 hidden md:block">
            <iframe
              src={`${pdfDoc.fileUrl}#page=${currentPage}&zoom=${zoomLevel}`}
              title={pdfDoc.fileName}
              className="w-full h-[600px] rounded-2xl bg-white shadow-xl border border-gray-300"
            />
          </div>
        )}

        {/* High-Fidelity Mobile-Responsive Interactive Document Sheet */}
        <div
          className="w-full max-w-2xl bg-white text-gray-950 rounded-2xl shadow-2xl border border-gray-200/80 p-6 sm:p-10 min-h-[580px] flex flex-col justify-between transition-transform duration-200 origin-top"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {/* Top Document Header */}
          <div>
            {renderPageContent(currentPage)}
          </div>

          {/* Bottom Document Page Footer */}
          <div className="pt-6 mt-8 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span className="truncate">{pdfDoc.fileName}</span>
            <span className="font-mono font-semibold">Page {currentPage} of {totalPages}</span>
          </div>
        </div>
      </div>

      {/* 5. SUMMARY & DOWNLOAD CARD */}
      <div className="w-full bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-xs mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h3 className="text-base font-bold font-rubik text-gray-900 dark:text-white">
            Need an offline copy?
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Download the original <strong className="text-gray-800 dark:text-gray-200">{pdfDoc.fileName}</strong> ({pdfDoc.fileSize}) directly to your device.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg transition cursor-pointer"
          >
            {downloading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download PDF ({pdfDoc.fileSize})</span>
          </button>
        </div>
      </div>

      {/* 6. MOBILE FLOATING STICKY ACTION BAR */}
      <div className="fixed bottom-4 inset-x-4 z-40 sm:hidden flex items-center justify-between gap-2 bg-[#181920]/95 backdrop-blur-md text-white p-2.5 rounded-2xl border border-white/15 shadow-2xl">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="p-2 rounded-xl bg-white/10 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono font-bold">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-xl bg-white/10 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 py-2 px-3 rounded-xl bg-red-600 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </button>

        <button
          type="button"
          onClick={onShare}
          className="p-2 rounded-xl bg-white/10"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
