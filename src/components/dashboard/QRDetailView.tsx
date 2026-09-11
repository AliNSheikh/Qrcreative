import React, { useRef, useEffect, useState } from 'react';
import { QRCodeRecord } from '../../types';
import { renderQRToCanvas, formatQRContent, generateQRSVG } from '../../lib/qr/generator';
import { getSiteUrl } from '../../lib/config';
import {
  ArrowLeft,
  Edit,
  Download,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  BarChart2,
  Trash2,
  Info
} from 'lucide-react';

interface QRDetailViewProps {
  qr: QRCodeRecord;
  onBack: () => void;
  onEdit: (qr: QRCodeRecord) => void;
  onDuplicate: (qr: QRCodeRecord) => void;
  onDelete: (qr: QRCodeRecord) => void;
}

export const QRDetailView: React.FC<QRDetailViewProps> = ({
  qr,
  onBack,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDest, setCopiedDest] = useState(false);

  const isEditable = qr.mode === 'editable';
  const redirectUrl = isEditable && qr.slug
    ? `${getSiteUrl()}/r/${qr.slug}`
    : '';

  const formattedContent = formatQRContent(
    qr.type,
    qr.content,
    qr.mode,
    qr.slug,
    getSiteUrl()
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    renderQRToCanvas(canvasRef.current, formattedContent, qr.design, 800);
  }, [qr, formattedContent]);

  const handleDownload = async (format: 'png' | 'svg' | 'jpeg') => {
    const fileName = `${qr.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'qr'}.${format}`;
    if (format === 'svg') {
      const svg = generateQRSVG(formattedContent, qr.design, 1024);
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const exportCanvas = document.createElement('canvas');
      await renderQRToCanvas(exportCanvas, formattedContent, qr.design, 1024);
      const dataUrl = exportCanvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      a.click();
    }
  };

  const copyToClipboard = (text: string, isRedirect: boolean) => {
    navigator.clipboard.writeText(text);
    if (isRedirect) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedDest(true);
      setTimeout(() => setCopiedDest(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-[#64748b] hover:text-[#111827] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My QR Codes</span>
      </button>

      {/* Main Detail Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Preview: Canvas */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="p-6 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                className="w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-xl object-contain shadow-xs"
              />
            </div>

            {/* Quick Format Downloads */}
            <div className="w-full mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => handleDownload('png')}
                className="flex-1 py-2 px-3 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#111827] hover:bg-[#f8fafc] flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-[#6d5dfc]" />
                <span>PNG (1024px)</span>
              </button>

              <button
                onClick={() => handleDownload('svg')}
                className="flex-1 py-2 px-3 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#111827] hover:bg-[#f8fafc] flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-[#13b8a6]" />
                <span>Vector SVG</span>
              </button>
            </div>
          </div>

          {/* Right Information & Actions */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[#111827]">
                  {qr.type}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isEditable ? 'bg-[#13b8a6]/15 text-[#0f766e]' : 'bg-[#f1f5f9] text-[#64748b]'
                }`}>
                  {isEditable ? 'Editable Dynamic QR' : 'Static QR'}
                </span>
                {isEditable && (
                  <span className="text-xs text-[#6d5dfc] font-medium flex items-center gap-1 ml-auto">
                    <BarChart2 className="w-3.5 h-3.5" />
                    {qr.scans_count || 0} scans
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                {qr.name}
              </h1>

              <div className="mt-2 flex items-center gap-4 text-xs text-[#94a3b8]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Created {new Date(qr.created_at).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>Updated {new Date(qr.updated_at || qr.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Editable Information Highlight */}
            {isEditable && (
              <div className="p-4 rounded-2xl bg-[#efedff]/50 border border-[#6d5dfc]/20 space-y-3">
                <div className="flex items-start gap-2 text-xs text-[#5a49ef]">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-medium">
                    You can change the destination URL anytime without replacing or reprinting this physical QR code!
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#64748b] mb-1">
                    qrcreative Redirect Link (Encoded in QR)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={redirectUrl}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#cbd5e1] bg-white text-xs font-mono text-[#111827]"
                    />
                    <button
                      onClick={() => copyToClipboard(redirectUrl, true)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#cbd5e1] text-xs font-semibold text-[#6d5dfc] hover:bg-[#f8fafc] flex items-center gap-1"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#6d5dfc] text-white text-xs font-semibold hover:bg-[#5a49ef] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Test</span>
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#64748b] mb-1">
                    Current Destination URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={qr.destination_url || qr.content?.url || ''}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#cbd5e1] bg-white text-xs font-mono text-[#111827]"
                    />
                    <button
                      onClick={() => copyToClipboard(qr.destination_url || qr.content?.url || '', false)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#cbd5e1] text-xs font-semibold text-[#111827] hover:bg-[#f8fafc] flex items-center gap-1"
                    >
                      {copiedDest ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDest ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Static Content Payload */}
            {!isEditable && (
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
                <label className="block text-[11px] font-semibold text-[#64748b]">
                  Encoded Static Payload
                </label>
                <div className="p-3 bg-white rounded-xl border border-[#e2e8f0] font-mono text-xs text-[#111827] whitespace-pre-wrap break-all">
                  {formattedContent}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#f1f5f9] flex flex-wrap items-center gap-3">
              <button
                onClick={() => onEdit(qr)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6d5dfc] hover:bg-[#5a49ef] shadow-sm shadow-[#6d5dfc]/20 transition"
              >
                <Edit className="w-4 h-4" />
                <span>Edit QR & Destination</span>
              </button>

              <button
                onClick={() => onDuplicate(qr)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-[#111827] bg-white border border-[#cbd5e1] hover:bg-[#f8fafc] transition"
              >
                <Copy className="w-4 h-4 text-[#64748b]" />
                <span>Duplicate</span>
              </button>

              <button
                onClick={() => onDelete(qr)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete QR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
