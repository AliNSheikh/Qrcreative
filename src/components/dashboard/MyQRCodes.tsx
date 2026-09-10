import React, { useState, useEffect, useRef } from 'react';
import { QRCodeRecord, UserProfile } from '../../types';
import { getUserQRCodes, deleteQRCode, duplicateQRCode } from '../../lib/storage';
import { renderQRToCanvas, formatQRContent } from '../../lib/qr/generator';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Copy,
  Trash2,
  ExternalLink,
  Download,
  Check,
  Calendar,
  Eye,
  BarChart2,
  QrCode,
  LayoutGrid,
  List,
  AlertTriangle
} from 'lucide-react';

interface MyQRCodesProps {
  currentUser: UserProfile;
  onCreateNew: () => void;
  onEditQR: (qr: QRCodeRecord) => void;
  onViewDetails: (qr: QRCodeRecord) => void;
}

// Mini Canvas Thumbnail Component
const QRThumbnail: React.FC<{ qr: QRCodeRecord }> = ({ qr }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const formatted = formatQRContent(
      qr.type,
      qr.content,
      qr.mode,
      qr.slug,
      typeof window !== 'undefined' ? window.location.origin : undefined
    );
    renderQRToCanvas(canvasRef.current, formatted, qr.design, 240);
  }, [qr]);

  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
      <canvas ref={canvasRef} className="w-full h-full object-contain rounded-lg" />
    </div>
  );
};

export const MyQRCodes: React.FC<MyQRCodesProps> = ({
  currentUser,
  onCreateNew,
  onEditQR,
  onViewDetails
}) => {
  const [qrList, setQrList] = useState<QRCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'name' | 'scans'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Deletion modal state
  const [deletingQR, setDeletingQR] = useState<QRCodeRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const data = await getUserQRCodes(currentUser.id);
      setQrList(data);
    } catch (err) {
      console.error('Error loading QR codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, [currentUser.id]);

  // Copy destination or redirect link
  const handleCopyLink = (qr: QRCodeRecord) => {
    const link = qr.mode === 'editable' && qr.slug
      ? `${window.location.origin}/r/${qr.slug}`
      : qr.destination_url || qr.content?.url || 'https://qrcreative.app';

    navigator.clipboard.writeText(link);
    setCopiedId(qr.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Duplicate handler
  const handleDuplicate = async (qr: QRCodeRecord) => {
    try {
      const copy = await duplicateQRCode(qr.id, currentUser.id);
      setQrList(prev => [copy, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Duplicate failed');
    }
  };

  // Delete confirmation handler
  const handleConfirmDelete = async () => {
    if (!deletingQR) return;
    setIsDeleting(true);
    try {
      await deleteQRCode(deletingQR.id);
      setQrList(prev => prev.filter(c => c.id !== deletingQR.id));
      setDeletingQR(null);
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Download PNG
  const handleQuickDownload = async (qr: QRCodeRecord) => {
    const exportCanvas = document.createElement('canvas');
    const formatted = formatQRContent(
      qr.type,
      qr.content,
      qr.mode,
      qr.slug,
      typeof window !== 'undefined' ? window.location.origin : undefined
    );
    await renderQRToCanvas(exportCanvas, formatted, qr.design, 1024);
    const dataUrl = exportCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${qr.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'qr'}.png`;
    a.click();
  };

  // Filtering & Sorting
  const filteredList = qrList
    .filter(item => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.destination_url && item.destination_url.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType = typeFilter === 'all' || item.type === typeFilter;
      const matchMode = modeFilter === 'all' || item.mode === modeFilter;

      return matchSearch && matchType && matchMode;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'scans') return (b.scans_count || 0) - (a.scans_count || 0);
      return 0;
    });

  // Calculate Summary Metrics
  const totalCodes = qrList.length;
  const staticCodes = qrList.filter(c => c.mode === 'static').length;
  const editableCodes = qrList.filter(c => c.mode === 'editable').length;
  const totalScans = qrList.reduce((acc, c) => acc + (c.scans_count || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
            Welcome back, {currentUser.display_name}
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Manage your saved QR codes, update destination links, and export crisp files.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6d5dfc] hover:bg-[#5a49ef] shadow-sm shadow-[#6d5dfc]/20 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New QR</span>
        </button>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Total QR Codes</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1">{totalCodes}</h3>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Static Codes</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1">{staticCodes}</h3>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
          <p className="text-xs font-semibold text-[#13b8a6] uppercase tracking-wider">Editable Codes</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1">{editableCodes}</h3>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
          <p className="text-xs font-semibold text-[#6d5dfc] uppercase tracking-wider">Total Scans</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1">{totalScans}</h3>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#94a3b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or destination..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-[#cbd5e1] text-sm text-[#111827] placeholder-[#94a3b8] outline-none focus:border-[#6d5dfc] focus:ring-2 focus:ring-[#6d5dfc]/20 transition"
            />
          </div>

          {/* Filter Dropdowns & View Mode */}
          <div className="w-full md:w-auto flex flex-wrap items-center gap-2.5">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#111827] bg-white outline-none"
            >
              <option value="all">All Types</option>
              <option value="url">Website URL</option>
              <option value="wifi">Wi-Fi</option>
              <option value="vcard">vCard / Contact</option>
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="event">Event</option>
              <option value="location">Location</option>
            </select>

            {/* Mode Filter */}
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#111827] bg-white outline-none"
            >
              <option value="all">All Modes</option>
              <option value="static">Static</option>
              <option value="editable">Editable</option>
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#111827] bg-white outline-none"
            >
              <option value="latest">Latest Updated</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name (A-Z)</option>
              <option value="scans">Most Scanned</option>
            </select>

            {/* Grid / Table Toggle */}
            <div className="hidden sm:flex items-center border border-[#e2e8f0] rounded-xl p-0.5 bg-[#f8fafc]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white shadow-2xs text-[#6d5dfc]' : 'text-[#64748b] hover:text-[#111827]'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-white shadow-2xs text-[#6d5dfc]' : 'text-[#64748b] hover:text-[#111827]'
                }`}
                aria-label="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-white border border-[#e2e8f0] p-6"></div>
          ))}
        </div>
      )}

      {/* Empty Collection State (as specified in Section 46) */}
      {!loading && qrList.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-[#e2e8f0] bg-white p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#efedff] flex items-center justify-center text-[#6d5dfc]">
            <QrCode className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#111827]">
            Your QR collection starts here.
          </h2>
          <p className="mt-2 text-sm text-[#64748b] leading-relaxed">
            Create and save your first QR code to access it anytime, update dynamic destinations, and track scans.
          </p>
          <button
            onClick={onCreateNew}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6d5dfc] hover:bg-[#5a49ef] shadow-md shadow-[#6d5dfc]/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create My First QR</span>
          </button>
        </div>
      )}

      {/* No Search Results */}
      {!loading && qrList.length > 0 && filteredList.length === 0 && (
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-10 text-center">
          <p className="text-sm font-semibold text-[#111827]">No QR codes match your search criteria.</p>
          <p className="text-xs text-[#64748b] mt-1">Try resetting your filters or search keyword.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('all');
              setModeFilter('all');
            }}
            className="mt-4 px-4 py-1.5 text-xs font-semibold text-[#6d5dfc] hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* GRID VIEW */}
      {!loading && filteredList.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map(qr => {
            const isEditable = qr.mode === 'editable';
            const redirectUrl = isEditable && qr.slug ? `/r/${qr.slug}` : qr.destination_url || qr.content?.url;

            return (
              <div
                key={qr.id}
                className="rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[#111827]">
                      {qr.type}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isEditable ? 'bg-[#13b8a6]/15 text-[#0f766e]' : 'bg-[#f1f5f9] text-[#64748b]'
                      }`}>
                        {isEditable ? 'Editable' : 'Static'}
                      </span>

                      {isEditable && (
                        <span className="text-[10px] font-medium text-[#64748b] flex items-center gap-1">
                          <BarChart2 className="w-3 h-3 text-[#6d5dfc]" />
                          {qr.scans_count || 0} scans
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body: Thumbnail & Details */}
                  <div className="flex items-start gap-4">
                    <QRThumbnail qr={qr} />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-[#111827] truncate group-hover:text-[#6d5dfc] transition">
                        {qr.name}
                      </h4>

                      <p className="text-xs text-[#64748b] truncate mt-0.5 font-mono">
                        {redirectUrl}
                      </p>

                      <p className="text-[10px] text-[#94a3b8] mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Updated {new Date(qr.updated_at || qr.created_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-[#f1f5f9] flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewDetails(qr)}
                      className="p-1.5 rounded-lg text-[#64748b] hover:text-[#111827] hover:bg-[#f8fafc] transition"
                      title="View Details"
                      aria-label="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onEditQR(qr)}
                      className="p-1.5 rounded-lg text-[#64748b] hover:text-[#6d5dfc] hover:bg-[#efedff] transition"
                      title="Edit QR Code & Destination"
                      aria-label="Edit QR"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDuplicate(qr)}
                      className="p-1.5 rounded-lg text-[#64748b] hover:text-[#111827] hover:bg-[#f8fafc] transition"
                      title="Duplicate QR"
                      aria-label="Duplicate QR"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleQuickDownload(qr)}
                      className="p-1.5 rounded-lg text-[#64748b] hover:text-[#111827] hover:bg-[#f8fafc] transition"
                      title="Download PNG"
                      aria-label="Download PNG"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyLink(qr)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#6d5dfc] hover:bg-[#efedff] transition"
                    >
                      {copiedId === qr.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setDeletingQR(qr)}
                      className="p-1.5 rounded-lg text-[#94a3b8] hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete QR"
                      aria-label="Delete QR"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {!loading && filteredList.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                  <th className="py-3.5 px-4">QR</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Scans</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] text-xs">
                {filteredList.map(qr => (
                  <tr key={qr.id} className="hover:bg-[#f8fafc] transition">
                    <td className="py-2.5 px-4">
                      <QRThumbnail qr={qr} />
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#111827]">
                      {qr.name}
                    </td>
                    <td className="py-2.5 px-4 uppercase font-semibold text-[#64748b]">
                      {qr.type}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        qr.mode === 'editable' ? 'bg-[#13b8a6]/15 text-[#0f766e]' : 'bg-[#f1f5f9] text-[#64748b]'
                      }`}>
                        {qr.mode}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[#64748b] max-w-[200px] truncate">
                      {qr.mode === 'editable' ? `/r/${qr.slug}` : (qr.destination_url || qr.content?.url)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-[#111827]">
                      {qr.scans_count || 0}
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => onViewDetails(qr)}
                        className="p-1.5 rounded-lg text-[#64748b] hover:text-[#111827]"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => onEditQR(qr)}
                        className="p-1.5 rounded-lg text-[#64748b] hover:text-[#6d5dfc]"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(qr)}
                        className="p-1.5 rounded-lg text-[#64748b] hover:text-[#111827]"
                      >
                        <Copy className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleQuickDownload(qr)}
                        className="p-1.5 rounded-lg text-[#64748b] hover:text-[#111827]"
                      >
                        <Download className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => setDeletingQR(qr)}
                        className="p-1.5 rounded-lg text-[#94a3b8] hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (as specified in Section 22) */}
      {deletingQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center gap-3 mb-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">
                Delete this QR code?
              </h3>
            </div>

            <p className="text-xs text-[#64748b] leading-relaxed mb-4">
              This action cannot be undone. If this is an editable QR code, existing printed copies will stop redirecting correctly.
            </p>

            <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#111827] font-medium mb-5">
              Deleting: <strong>{deletingQR.name}</strong> ({deletingQR.mode === 'editable' ? 'Editable Dynamic' : 'Static'})
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingQR(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition"
              >
                {isDeleting ? 'Deleting...' : 'Delete QR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
