import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeRecord, QRScanRecord } from '../../types';
import { getScanRecords, recordScanEvent, clearScansForQR } from '../../lib/storage';
import { getCountryFlag, getCountryName, COMMON_COUNTRIES, detectClientLocation, parseClientAgent } from '../../lib/geo';
import {
  BarChart3,
  Globe,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  RefreshCw,
  Search,
  Check,
  Calendar,
  Sparkles,
  Play,
  RotateCcw,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface QRScanAnalyticsProps {
  qr: QRCodeRecord;
  onScanCountUpdated?: (newCount: number) => void;
}

export const QRScanAnalytics: React.FC<QRScanAnalyticsProps> = ({ qr, onScanCountUpdated }) => {
  const [scans, setScans] = useState<QRScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllRows, setShowAllRows] = useState(false);
  const [justScannedId, setJustScannedId] = useState<string | null>(null);

  // Test scan form state
  const [testCountryCode, setTestCountryCode] = useState('US');
  const [testDevice, setTestDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [testSimulating, setTestSimulating] = useState(false);
  const [autoLocation, setAutoLocation] = useState<{ country: string; code: string } | null>(null);

  // Load scans on mount or when QR changes
  const loadScans = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const records = await getScanRecords(qr.id);
      setScans(records);
      if (onScanCountUpdated && records.length !== qr.scans_count) {
        onScanCountUpdated(records.length);
      }
    } catch (err) {
      console.error('Error loading scans:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadScans();
    // Pre-detect current location for quick test
    detectClientLocation().then(geo => {
      setAutoLocation({ country: geo.country, code: geo.country_code });
      setTestCountryCode(geo.country_code);
    }).catch(() => {});
  }, [qr.id]);

  // Aggregate stats
  const totalScans = Math.max(scans.length, qr.scans_count || 0);

  // Country breakdown: count per country
  const countryStats = useMemo(() => {
    const map = new Map<string, { country: string; code: string; count: number }>();
    for (const s of scans) {
      const code = (s.country_code || 'US').toUpperCase();
      const country = s.country || getCountryName(code);
      const existing = map.get(code) || { country, code, count: 0 };
      existing.count += 1;
      map.set(code, existing);
    }
    const list = Array.from(map.values());
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [scans]);

  const uniqueCountriesCount = countryStats.length;
  const topCountry = countryStats[0] || null;

  // Device breakdown
  const deviceStats = useMemo(() => {
    let mobile = 0;
    let desktop = 0;
    let tablet = 0;
    for (const s of scans) {
      if (s.device_type === 'mobile') mobile++;
      else if (s.device_type === 'tablet') tablet++;
      else desktop++;
    }
    const total = scans.length || 1;
    return {
      mobile,
      desktop,
      tablet,
      mobilePct: Math.round((mobile / total) * 100),
      desktopPct: Math.round((desktop / total) * 100),
      tabletPct: Math.round((tablet / total) * 100)
    };
  }, [scans]);

  // Activity by date (last 7 days)
  const activityTimeline = useMemo(() => {
    const days: { label: string; dateStr: string; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
      days.push({ label, dateStr, count: 0 });
    }

    for (const s of scans) {
      const scanDate = s.scanned_at ? s.scanned_at.split('T')[0] : '';
      const found = days.find(d => d.dateStr === scanDate);
      if (found) {
        found.count += 1;
      }
    }

    const maxCount = Math.max(...days.map(d => d.count), 1);
    return { days, maxCount };
  }, [scans]);

  // Latest scan
  const latestScan = scans[0] || null;

  // Filtered scans for the audit table
  const filteredScans = useMemo(() => {
    return scans.filter(s => {
      // Country filter
      if (selectedCountryFilter !== 'all') {
        const code = (s.country_code || '').toUpperCase();
        if (code !== selectedCountryFilter) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const country = (s.country || '').toLowerCase();
        const city = (s.city || '').toLowerCase();
        const code = (s.country_code || '').toLowerCase();
        const device = (s.device_type || '').toLowerCase();
        const date = new Date(s.scanned_at).toLocaleString().toLowerCase();
        return country.includes(q) || city.includes(q) || code.includes(q) || device.includes(q) || date.includes(q);
      }
      return true;
    });
  }, [scans, selectedCountryFilter, searchQuery]);

  const displayedScans = showAllRows ? filteredScans : filteredScans.slice(0, 10);

  // Helper for human-readable relative time
  const getRelativeTime = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const seconds = Math.floor(diff / 1000);
      if (seconds < 45) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // Run a test scan
  const handleExecuteTestScan = async (overrideCountryCode?: string) => {
    setTestSimulating(true);
    const code = (overrideCountryCode || testCountryCode || 'US').toUpperCase();
    const countryName = getCountryName(code);
    const matchedPreset = COMMON_COUNTRIES.find(c => c.code === code);

    try {
      const newScan = await recordScanEvent(qr.id, {
        country: countryName,
        country_code: code,
        city: matchedPreset?.city || undefined,
        device_type: testDevice,
        referrer: 'https://qrcreative.vercel.app/test-scan',
        user_agent: navigator.userAgent
      });

      setJustScannedId(newScan.id);
      setTimeout(() => setJustScannedId(null), 3000);

      // Refresh list
      await loadScans(true);
      setTestModalOpen(false);
    } catch (err) {
      console.error('Failed to record test scan:', err);
    } finally {
      setTestSimulating(false);
    }
  };

  // Export scans as CSV
  const handleExportCSV = () => {
    if (scans.length === 0) return;
    const headers = ['Scan ID', 'Scanned At (ISO)', 'Date Local', 'Country', 'Country Code', 'City', 'Device Type', 'Referrer', 'User Agent'];
    const rows = scans.map(s => [
      `"${s.id}"`,
      `"${s.scanned_at}"`,
      `"${new Date(s.scanned_at).toLocaleString()}"`,
      `"${s.country || 'Unknown'}"`,
      `"${s.country_code || 'XX'}"`,
      `"${s.city || ''}"`,
      `"${s.device_type}"`,
      `"${s.referrer || ''}"`,
      `"${(s.user_agent || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${qr.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-scans.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear scans
  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to reset all scan history for this QR code?')) {
      await clearScansForQR(qr.id);
      await loadScans();
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-xs space-y-8" id="qr-analytics-section">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#f1f5f9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#efedff] text-[#6d5dfc] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[#111827] tracking-tight">
              Scan Tracking & Analytics
            </h2>
            <span className="text-[11px] font-semibold text-[#13b8a6] bg-[#13b8a6]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#13b8a6] animate-pulse" />
              Live Tracking
            </span>
          </div>
          <p className="text-xs text-[#64748b]">
            Monitors real-time scan counts, geographic country locations, and scanning device distributions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Test Scan Trigger Button */}
          <button
            onClick={() => setTestModalOpen(!testModalOpen)}
            className="px-3.5 py-2 rounded-xl bg-[#6d5dfc] hover:bg-[#5a49ef] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Simulate or record a test scan"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Test Scan</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => loadScans(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#64748b] hover:text-[#111827] transition"
            title="Refresh scan stats"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#6d5dfc]' : ''}`} />
          </button>

          {/* CSV Export Button */}
          {scans.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-xl border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#64748b] hover:text-[#111827] transition"
              title="Export scan history to CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Test Scan Drawer / Panel */}
      {testModalOpen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#f8fafc] border border-[#cbd5e1] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6d5dfc]" />
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                Simulate or Record a Scan Event
              </h3>
            </div>
            <button
              onClick={() => setTestModalOpen(false)}
              className="text-xs text-[#64748b] hover:text-[#111827] font-semibold"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-[#64748b]">
            Test how the scan tracking system captures timestamps, countries, and devices without waiting for a physical scan.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Country Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-[#64748b] mb-1">
                Scan Location (Country)
              </label>
              <select
                value={testCountryCode}
                onChange={(e) => setTestCountryCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#cbd5e1] bg-white text-xs font-semibold text-[#111827]"
              >
                {autoLocation && (
                  <option value={autoLocation.code}>
                    {getCountryFlag(autoLocation.code)} {autoLocation.country} (Your Detected Location)
                  </option>
                )}
                {COMMON_COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {getCountryFlag(c.code)} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Type */}
            <div>
              <label className="block text-[11px] font-semibold text-[#64748b] mb-1">
                Device Type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['mobile', 'desktop', 'tablet'] as const).map(dt => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setTestDevice(dt)}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold capitalize transition flex items-center justify-center gap-1 ${
                      testDevice === dt
                        ? 'bg-[#111827] text-white'
                        : 'bg-white border border-[#cbd5e1] text-[#64748b] hover:text-[#111827]'
                    }`}
                  >
                    {dt === 'mobile' && <Smartphone className="w-3 h-3" />}
                    {dt === 'desktop' && <Monitor className="w-3 h-3" />}
                    {dt === 'tablet' && <Tablet className="w-3 h-3" />}
                    <span>{dt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger Button */}
            <div className="flex items-end">
              <button
                type="button"
                disabled={testSimulating}
                onClick={() => handleExecuteTestScan()}
                className="w-full py-2.5 px-4 rounded-xl bg-[#6d5dfc] hover:bg-[#5a49ef] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
              >
                {testSimulating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white" />
                )}
                <span>Record Test Scan</span>
              </button>
            </div>
          </div>

          {/* Quick preset country chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-[#64748b] mr-1">Quick Scan from:</span>
            {COMMON_COUNTRIES.slice(0, 7).map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleExecuteTestScan(c.code)}
                disabled={testSimulating}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#cbd5e1] hover:border-[#6d5dfc] hover:bg-[#efedff]/40 text-xs font-semibold text-[#111827] flex items-center gap-1 transition"
              >
                <span>{getCountryFlag(c.code)}</span>
                <span>{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] relative overflow-hidden">
          <div className="flex items-center justify-between text-[#64748b] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Scans</span>
            <div className="w-6 h-6 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center text-[#6d5dfc]">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#111827] tracking-tight">
            {totalScans}
          </div>
          <p className="text-[11px] text-[#64748b] mt-1 font-medium">
            {totalScans === 1 ? '1 scan recorded' : `${totalScans} verified scans`}
          </p>
        </div>

        {/* Unique Countries */}
        <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] relative overflow-hidden">
          <div className="flex items-center justify-between text-[#64748b] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Where (Countries)</span>
            <div className="w-6 h-6 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center text-[#13b8a6]">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#111827] tracking-tight">
            {uniqueCountriesCount}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1 font-medium flex items-center gap-1 truncate">
            {countryStats.slice(0, 4).map(c => (
              <span key={c.code} title={`${c.country}: ${c.count} scans`}>
                {getCountryFlag(c.code)}
              </span>
            ))}
            <span>{uniqueCountriesCount > 0 ? 'reached worldwide' : 'no countries yet'}</span>
          </div>
        </div>

        {/* Top Country */}
        <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] relative overflow-hidden">
          <div className="flex items-center justify-between text-[#64748b] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Location</span>
            <div className="w-6 h-6 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center text-[#f59e0b]">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[#111827] tracking-tight truncate flex items-center gap-1.5">
            {topCountry ? (
              <>
                <span className="text-2xl">{getCountryFlag(topCountry.code)}</span>
                <span className="truncate">{topCountry.country}</span>
              </>
            ) : (
              <span className="text-[#94a3b8] text-base font-medium">Awaiting scan</span>
            )}
          </div>
          <p className="text-[11px] text-[#64748b] mt-1 font-medium">
            {topCountry
              ? `${topCountry.count} scans (${Math.round((topCountry.count / (totalScans || 1)) * 100)}%)`
              : 'Location appears on first scan'}
          </p>
        </div>

        {/* When (Latest Scan) */}
        <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] relative overflow-hidden">
          <div className="flex items-center justify-between text-[#64748b] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">When (Last Scan)</span>
            <div className="w-6 h-6 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center text-[#64748b]">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base font-extrabold text-[#111827] tracking-tight truncate">
            {latestScan ? getRelativeTime(latestScan.scanned_at) : 'No scans yet'}
          </div>
          <p className="text-[11px] text-[#64748b] mt-1 font-medium truncate">
            {latestScan
              ? `${getCountryFlag(latestScan.country_code)} ${latestScan.country || 'Unknown'}`
              : 'Scan to register activity'}
          </p>
        </div>
      </div>

      {/* 3. Deep Dive Analytics: "Where" (Countries) and "When" (Activity Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WHERE: Geographic Breakdown (5 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-white border border-[#e2e8f0] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#6d5dfc]" />
              <h3 className="text-sm font-bold text-[#111827]">
                Where: Scans by Country
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#64748b]">
              {countryStats.length} {countryStats.length === 1 ? 'country' : 'countries'}
            </span>
          </div>

          {countryStats.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#f1f5f9] text-[#94a3b8] flex items-center justify-center mx-auto">
                <Globe className="w-5 h-5" />
              </div>
              <p className="text-xs text-[#64748b]">
                No geographic scan data yet. Share your QR code or run a test scan to record countries!
              </p>
              <button
                onClick={() => handleExecuteTestScan('US')}
                className="px-3 py-1.5 rounded-lg bg-[#efedff] text-[#6d5dfc] text-xs font-bold hover:bg-[#6d5dfc] hover:text-white transition cursor-pointer"
              >
                + Run Quick US Scan Test
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {countryStats.map(stat => {
                const percentage = Math.round((stat.count / totalScans) * 100);
                return (
                  <div key={stat.code} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-medium text-[#111827]">
                        <span className="text-base">{getCountryFlag(stat.code)}</span>
                        <span>{stat.country}</span>
                        <span className="text-[10px] font-mono font-bold text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.2 rounded">
                          {stat.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                        <span>{stat.count} {stat.count === 1 ? 'scan' : 'scans'}</span>
                        <span className="text-[#64748b] w-9 text-right">{percentage}%</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-[#f1f5f9] overflow-hidden">
                      <div
                        className="h-full bg-[#6d5dfc] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* WHEN: Activity Timeline & Device Breakdown (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Activity Over Time (Last 7 Days) */}
          <div className="p-5 rounded-2xl bg-white border border-[#e2e8f0] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#13b8a6]" />
                <h3 className="text-sm font-bold text-[#111827]">
                  When: Scan Activity (Last 7 Days)
                </h3>
              </div>
              <span className="text-xs text-[#64748b]">Daily Trends</span>
            </div>

            <div className="pt-2">
              <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-1 border-b border-[#f1f5f9]">
                {activityTimeline.days.map((d, idx) => {
                  const heightPct = activityTimeline.maxCount > 0
                    ? Math.max(Math.round((d.count / activityTimeline.maxCount) * 100), 8)
                    : 8;
                  const isToday = idx === activityTimeline.days.length - 1;

                  return (
                    <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-bold text-[#64748b] group-hover:text-[#111827] opacity-0 group-hover:opacity-100 transition">
                        {d.count}
                      </span>
                      <div className="w-full max-w-[28px] h-full flex items-end justify-center bg-[#f1f5f9] rounded-lg p-0.5">
                        <div
                          className={`w-full rounded-md transition-all duration-500 ${
                            isToday ? 'bg-[#13b8a6]' : 'bg-[#6d5dfc]'
                          } ${d.count > 0 ? 'opacity-100' : 'opacity-20'}`}
                          style={{ height: `${d.count > 0 ? heightPct : 6}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-semibold truncate ${
                        isToday ? 'text-[#13b8a6] font-bold' : 'text-[#64748b]'
                      }`}>
                        {d.label.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Device Distribution */}
          <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center text-[#111827]">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#111827] block">Devices</span>
                <span className="text-[11px] text-[#64748b]">Mobile vs Desktop</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1 text-[#6d5dfc]">
                <Smartphone className="w-3.5 h-3.5" />
                <span>{deviceStats.mobilePct}% Mobile</span>
              </div>
              <div className="flex items-center gap-1 text-[#64748b]">
                <Monitor className="w-3.5 h-3.5" />
                <span>{deviceStats.desktopPct}% Desktop</span>
              </div>
              {deviceStats.tablet > 0 && (
                <div className="flex items-center gap-1 text-[#f59e0b]">
                  <Tablet className="w-3.5 h-3.5" />
                  <span>{deviceStats.tabletPct}% Tablet</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete Scan History Table ("When, Where, and Details") */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">
              Detailed Scan History
            </h3>
            <p className="text-xs text-[#64748b]">
              Every verified scan event with exact timestamp and geographic origin.
            </p>
          </div>

          {/* Search & Country Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scans..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-[#cbd5e1] text-xs text-[#111827] placeholder:text-[#94a3b8] bg-white w-36 sm:w-48"
              />
            </div>

            {countryStats.length > 1 && (
              <select
                value={selectedCountryFilter}
                onChange={(e) => setSelectedCountryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#111827] bg-white"
              >
                <option value="all">All Countries</option>
                {countryStats.map(c => (
                  <option key={c.code} value={c.code}>
                    {getCountryFlag(c.code)} {c.country} ({c.count})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {displayedScans.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-[#cbd5e1] bg-[#f8fafc]">
            <BarChart3 className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#111827]">
              {searchQuery || selectedCountryFilter !== 'all'
                ? 'No scan records match your filter.'
                : 'No scan events recorded for this QR code yet.'}
            </p>
            <p className="text-[11px] text-[#64748b] mt-1">
              Whenever someone scans your QR code or opens its link, their location country and timestamp appear here.
            </p>
            <button
              onClick={() => setTestModalOpen(true)}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#6d5dfc] text-white text-xs font-bold hover:bg-[#5a49ef] transition cursor-pointer"
            >
              Simulate Test Scan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#e2e8f0]">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#64748b] border-b border-[#e2e8f0]">
                <tr>
                  <th className="py-3 px-4">When (Timestamp)</th>
                  <th className="py-3 px-4">Where (Country & Location)</th>
                  <th className="py-3 px-4">Device</th>
                  <th className="py-3 px-4">Source / Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {displayedScans.map(s => {
                  const isHighlighted = s.id === justScannedId;
                  const code = (s.country_code || 'US').toUpperCase();
                  const countryName = s.country || getCountryName(code);
                  const agent = parseClientAgent(s.user_agent);

                  return (
                    <tr
                      key={s.id}
                      className={`transition ${
                        isHighlighted
                          ? 'bg-[#efedff] animate-pulse'
                          : 'hover:bg-[#f8fafc]'
                      }`}
                    >
                      {/* When */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#111827]">
                          {new Date(s.scanned_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          {' '}
                          <span className="font-mono text-[#64748b]">
                            {new Date(s.scanned_at).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#6d5dfc] font-medium">
                          {getRelativeTime(s.scanned_at)}
                        </span>
                      </td>

                      {/* Where (Location Country) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 font-medium">
                          <span className="text-xl" title={countryName}>
                            {getCountryFlag(code)}
                          </span>
                          <div>
                            <div className="font-bold text-[#111827] flex items-center gap-1.5">
                              <span>{countryName}</span>
                              <span className="text-[10px] font-mono font-bold text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.2 rounded border border-[#e2e8f0]">
                                {code}
                              </span>
                            </div>
                            {s.city && (
                              <span className="text-[10px] text-[#64748b]">
                                {s.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Device */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium capitalize">
                          {s.device_type === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-[#6d5dfc]" />}
                          {s.device_type === 'desktop' && <Monitor className="w-3.5 h-3.5 text-[#64748b]" />}
                          {s.device_type === 'tablet' && <Tablet className="w-3.5 h-3.5 text-[#f59e0b]" />}
                          <span>{s.device_type || 'Device'}</span>
                        </div>
                        <span className="text-[10px] text-[#64748b]">
                          {agent.os} • {agent.browser}
                        </span>
                      </td>

                      {/* Referrer */}
                      <td className="py-3 px-4 text-[#64748b] max-w-[200px] truncate">
                        {s.referrer ? (
                          <span className="font-mono text-[11px] truncate block" title={s.referrer}>
                            {s.referrer.replace(/^https?:\/\//, '')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#13b8a6] font-semibold bg-[#13b8a6]/10 px-2 py-0.5 rounded-full inline-block">
                            Direct Camera Scan
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Expand / Collapse rows */}
        {filteredScans.length > 10 && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowAllRows(!showAllRows)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6d5dfc] hover:bg-[#efedff]/50 transition flex items-center gap-1.5 mx-auto"
            >
              {showAllRows ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Show Fewer Scans</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>View All {filteredScans.length} Recorded Scans</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Clear History link */}
        {scans.length > 0 && (
          <div className="pt-2 text-right">
            <button
              onClick={handleClearHistory}
              className="text-[11px] text-[#94a3b8] hover:text-red-600 transition underline cursor-pointer"
            >
              Reset scan history for this QR
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
