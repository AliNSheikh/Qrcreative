import React, { useState } from 'react';
import { LandingPageData, LandingPageLink, LandingPageSocial, LandingPageDesign } from '../../types';
import { getLandingPageUrl } from '../../lib/config';
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Globe,
  ExternalLink,
  Edit2,
  Check,
  Copy,
  Image as ImageIcon,
  Palette,
  Layout,
  Share2,
  Smartphone,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Sparkles,
  Briefcase,
  Feather,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  Store,
  BookOpen,
  Coffee,
  ShoppingBag,
  Star,
  FileText
} from 'lucide-react';

interface LandingPageEditorProps {
  data: LandingPageData;
  onChange: (updated: LandingPageData) => void;
  accountEmail?: string;
}

export const LandingPageEditor: React.FC<LandingPageEditorProps> = ({
  data,
  onChange,
  accountEmail
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'links' | 'contact' | 'design'>('links');
  const [newLinkModal, setNewLinkModal] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  // New Link form state
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkDesc, setNewLinkDesc] = useState('');
  const [newLinkIcon, setNewLinkIcon] = useState('globe');

  const [copiedUrl, setCopiedUrl] = useState(false);

  const cleanSlug = (data.slug || '').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
  const currentPublicUrl = getLandingPageUrl(cleanSlug || 'your-landing-page');

  const handleSlugChange = (newSlug: string) => {
    const formatted = newSlug
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
    onChange({
      ...data,
      slug: formatted
    });
  };

  const handleCopyUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentPublicUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  // Link Management
  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    let url = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      url = 'https://' + url;
    }

    const newLink: LandingPageLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newLinkTitle.trim(),
      url,
      description: newLinkDesc.trim() || undefined,
      icon: newLinkIcon,
      isActive: true,
      clicksCount: 0
    };

    onChange({
      ...data,
      links: [...(data.links || []), newLink]
    });

    // Reset
    setNewLinkTitle('');
    setNewLinkUrl('');
    setNewLinkDesc('');
    setNewLinkIcon('globe');
    setNewLinkModal(false);
  };

  const handleRemoveLink = (id: string) => {
    onChange({
      ...data,
      links: data.links.filter((l) => l.id !== id)
    });
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    const newLinks = [...data.links];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newLinks.length) return;
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIdx];
    newLinks[targetIdx] = temp;
    onChange({
      ...data,
      links: newLinks
    });
  };

  const handleToggleLinkActive = (id: string) => {
    onChange({
      ...data,
      links: data.links.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l))
    });
  };

  const handleUpdateLink = (id: string, updates: Partial<LandingPageLink>) => {
    onChange({
      ...data,
      links: data.links.map((l) => (l.id === id ? { ...l, ...updates } : l))
    });
  };

  // Design helpers
  const handleThemeChange = (theme: LandingPageDesign['theme']) => {
    onChange({
      ...data,
      design: {
        ...data.design,
        theme
      }
    });
  };

  const handleButtonStyleChange = (buttonStyle: LandingPageDesign['buttonStyle']) => {
    onChange({
      ...data,
      design: {
        ...data.design,
        buttonStyle
      }
    });
  };

  const handleLayoutTemplateChange = (layoutTemplate: 'minimal' | 'business' | 'creative') => {
    onChange({
      ...data,
      design: {
        ...data.design,
        layoutTemplate
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e3e5ed] shadow-sm overflow-hidden">
      {/* Top URL Banner: specifically https://qrcreative.vercel.app/landingpageurl */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#4981ff]/10 via-[#9ba2fb]/10 to-transparent border-b border-[#e3e5ed]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4981ff] bg-white px-2.5 py-0.5 rounded-full border border-[#4981ff]/20">
              Landing Page URL
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-xs sm:text-sm text-[#0a0909]">
              <span className="text-[#84868e]">https://qrcreative.vercel.app/</span>
              <input
                type="text"
                value={data.slug || ''}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="landingpageurl"
                className="font-bold text-[#4981ff] bg-white border border-[#4981ff]/30 focus:border-[#4981ff] focus:ring-2 focus:ring-[#4981ff]/20 rounded-md px-2 py-0.5 outline-none max-w-[180px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e3e5ed] hover:bg-gray-50 text-xs font-semibold text-[#0a0909] transition shadow-xs"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#16a34a]" />
                  <span className="text-[#16a34a]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#4981ff]" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <a
              href={`/${cleanSlug || 'qr'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4981ff] text-white hover:bg-[#386fe3] text-xs font-semibold transition shadow-xs"
            >
              <span>Test Live</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Editor Subtabs */}
      <div className="flex border-b border-[#e3e5ed] px-4 pt-2 bg-[#f5f6fb]">
        {[
          { id: 'links', label: `Links (${data.links?.length || 0})`, icon: Globe },
          { id: 'content', label: 'Header & Bio', icon: Layout },
          { id: 'contact', label: 'Contact & Socials', icon: Share2 },
          { id: 'design', label: 'Theme & Style', icon: Palette }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
                isActive
                  ? 'border-[#4981ff] text-[#4981ff] bg-white rounded-t-lg'
                  : 'border-transparent text-[#84868e] hover:text-[#0a0909]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="p-4 sm:p-6">
        {/* 1. LINKS TAB (Add, Edit, Remove, Reorder) */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0a0909] font-rubik">
                  Landing Page Links
                </h3>
                <p className="text-xs text-[#84868e]">
                  Add, edit, or remove links. Visitors will see these on your landing page.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNewLinkModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4981ff] hover:bg-[#386fe3] text-white text-xs font-bold transition shadow-xs active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Link</span>
              </button>
            </div>

            {/* Link Items */}
            {(!data.links || data.links.length === 0) ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-[#e3e5ed] rounded-xl bg-gray-50/50">
                <Globe className="w-8 h-8 text-[#84868e] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#0a0909]">No custom links yet</p>
                <p className="text-xs text-[#84868e] mt-1 max-w-sm mx-auto">
                  Click "+ Add Link" to add your website, store, portfolio, PDF menu, or booking page.
                </p>
                <button
                  type="button"
                  onClick={() => setNewLinkModal(true)}
                  className="mt-3 px-4 py-2 bg-[#4981ff] text-white text-xs font-bold rounded-lg hover:bg-[#386fe3]"
                >
                  + Add Your First Link
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.links.map((link, idx) => (
                  <div
                    key={link.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      link.isActive !== false
                        ? 'border-[#e3e5ed] bg-white hover:border-[#4981ff]/40 shadow-xs'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    {/* Left details */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Reorder controls */}
                      <div className="flex flex-col gap-0.5 text-[#84868e]">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveLink(idx, 'up')}
                          className="hover:text-[#4981ff] disabled:opacity-20 disabled:hover:text-inherit"
                          title="Move up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === data.links.length - 1}
                          onClick={() => handleMoveLink(idx, 'down')}
                          className="hover:text-[#4981ff] disabled:opacity-20 disabled:hover:text-inherit"
                          title="Move down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-2 rounded-lg bg-[#4981ff]/10 text-[#4981ff] shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-xs sm:text-sm text-[#0a0909] truncate">
                          {link.title}
                        </div>
                        <div className="text-[11px] text-[#84868e] truncate font-mono">
                          {link.url}
                        </div>
                        {link.description && (
                          <div className="text-[11px] text-[#3f3e3e] italic truncate">
                            {link.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {/* Active toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleLinkActive(link.id)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md transition ${
                          link.isActive !== false
                            ? 'bg-[#16a34a]/10 text-[#16a34a]'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {link.isActive !== false ? 'Active' : 'Hidden'}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(link.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Form Modal / Box */}
            {newLinkModal && (
              <div className="mt-4 p-4 rounded-xl border border-[#4981ff]/30 bg-[#4981ff]/5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#0a0909] uppercase tracking-wider">
                    Add New Link
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewLinkModal(false)}
                    className="text-xs text-[#84868e] hover:text-[#0a0909]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0a0909] mb-1">
                      Link Title *
                    </label>
                    <input
                      type="text"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="e.g. Order Online, My Portfolio, Website"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-[#e3e5ed] bg-white focus:border-[#4981ff] focus:ring-1 focus:ring-[#4981ff] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#0a0909] mb-1">
                      Destination URL *
                    </label>
                    <input
                      type="url"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://example.com/shop"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-[#e3e5ed] bg-white focus:border-[#4981ff] focus:ring-1 focus:ring-[#4981ff] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-[11px] font-semibold text-[#0a0909] mb-1">
                    Subtitle / Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newLinkDesc}
                    onChange={(e) => setNewLinkDesc(e.target.value)}
                    placeholder="e.g. 20% off all seasonal items this week"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-[#e3e5ed] bg-white focus:border-[#4981ff] focus:ring-1 focus:ring-[#4981ff] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewLinkModal(false)}
                    className="px-3 py-1.5 text-xs text-[#84868e] hover:text-[#0a0909]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                    className="px-4 py-1.5 bg-[#4981ff] text-white text-xs font-bold rounded-lg hover:bg-[#386fe3] disabled:opacity-50 transition"
                  >
                    Save Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. CONTENT / HEADER & BIO TAB */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0a0909] mb-1">
                Page Title / Brand Name *
              </label>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => onChange({ ...data, title: e.target.value })}
                placeholder="e.g. Bella Cucina Bistro, Sarah Chen Design"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] focus:ring-2 focus:ring-[#4981ff]/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0a0909] mb-1">
                Category / Badge
              </label>
              <input
                type="text"
                value={data.badge || ''}
                onChange={(e) => onChange({ ...data, badge: e.target.value })}
                placeholder="e.g. Digital Menu, Official Creator, Retail Shop"
                className="w-full text-sm px-3.5 py-2 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] focus:ring-1 focus:ring-[#4981ff] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0a0909] mb-1">
                Bio / Description
              </label>
              <textarea
                rows={3}
                value={data.bio || ''}
                onChange={(e) => onChange({ ...data, bio: e.target.value })}
                placeholder="Tell your visitors who you are or what this page is for..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] focus:ring-2 focus:ring-[#4981ff]/20 outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#0a0909] mb-1">
                  Avatar / Profile Image URL
                </label>
                <input
                  type="url"
                  value={data.avatarUrl || ''}
                  onChange={(e) => onChange({ ...data, avatarUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0a0909] mb-1">
                  Header Cover Banner Image URL
                </label>
                <input
                  type="url"
                  value={data.coverUrl || ''}
                  onChange={(e) => onChange({ ...data, coverUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#e3e5ed] focus:border-[#4981ff] outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. CONTACT & SOCIALS TAB */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#84868e]">
              Quick Action Buttons
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0a0909] mb-1">
                  Direct Phone Call
                </label>
                <div className="flex items-center gap-2 border border-[#e3e5ed] rounded-xl px-3 py-2 focus-within:border-[#4981ff]">
                  <Phone className="w-4 h-4 text-[#4981ff] shrink-0" />
                  <input
                    type="tel"
                    value={data.contact?.phone || ''}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        contact: { ...(data.contact || {}), phone: e.target.value }
                      })
                    }
                    placeholder="+1 555 123 4567"
                    className="w-full text-xs outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0a0909] mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2 border border-[#e3e5ed] rounded-xl px-3 py-2 focus-within:border-[#4981ff]">
                  <Mail className="w-4 h-4 text-[#4981ff] shrink-0" />
                  <input
                    type="email"
                    value={data.contact?.email || ''}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        contact: { ...(data.contact || {}), email: e.target.value }
                      })
                    }
                    placeholder="contact@business.com"
                    className="w-full text-xs outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0a0909] mb-1">
                  WhatsApp Number
                </label>
                <div className="flex items-center gap-2 border border-[#e3e5ed] rounded-xl px-3 py-2 focus-within:border-[#4981ff]">
                  <MessageCircle className="w-4 h-4 text-[#16a34a] shrink-0" />
                  <input
                    type="tel"
                    value={data.contact?.whatsapp || ''}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        contact: { ...(data.contact || {}), whatsapp: e.target.value }
                      })
                    }
                    placeholder="+1 555 987 6543"
                    className="w-full text-xs outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0a0909] mb-1">
                  Location / City
                </label>
                <div className="flex items-center gap-2 border border-[#e3e5ed] rounded-xl px-3 py-2 focus-within:border-[#4981ff]">
                  <MapPin className="w-4 h-4 text-[#ef4444] shrink-0" />
                  <input
                    type="text"
                    value={data.contact?.location || ''}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        contact: { ...(data.contact || {}), location: e.target.value }
                      })
                    }
                    placeholder="New York, NY"
                    className="w-full text-xs outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. THEME & APPEARANCE TAB */}
        {activeTab === 'design' && (
          <div className="space-y-6">
            {/* Layout Template Variations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#0a0909]">
                  Layout Structure & Style
                </label>
                <span className="text-[11px] text-[#4981ff] font-semibold">
                  3 Distinct Layouts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'minimal',
                    name: 'Minimal',
                    icon: Feather,
                    badge: 'Clean & Refined',
                    desc: 'Centered compact avatar, sleek understated link rows, and minimalist contact pills.'
                  },
                  {
                    id: 'business',
                    name: 'Business',
                    icon: Briefcase,
                    badge: 'Corporate & Trust',
                    desc: 'Official banner, quick action bar (Call, Email, WhatsApp, vCard), and structured cards.'
                  },
                  {
                    id: 'creative',
                    name: 'Creative',
                    icon: Sparkles,
                    badge: 'Dynamic & Bold',
                    desc: 'Vibrant gradient aura, highlighted featured link showcase, and social channel grid.'
                  }
                ].map((tpl) => {
                  const Icon = tpl.icon;
                  const isSelected = (data.design?.layoutTemplate || 'minimal') === tpl.id;

                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleLayoutTemplateChange(tpl.id as any)}
                      className={`relative p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#4981ff] bg-[#4981ff]/5 ring-2 ring-[#4981ff]/20 shadow-sm'
                          : 'border-[#e3e5ed] hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#4981ff] text-white'
                                : 'bg-[#f5f6fb] text-[#4981ff]'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-[#4981ff]/15 text-[#4981ff]'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {tpl.badge}
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-[#0a0909]">
                          {tpl.name}
                        </h5>
                        <p className="text-[11px] text-[#84868e] mt-1 leading-relaxed">
                          {tpl.desc}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-[#4981ff]/20 flex items-center gap-1 text-[11px] font-bold text-[#4981ff]">
                          <Check className="w-3 h-3" />
                          <span>Active Layout</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0a0909] mb-2">
                Color Palette Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'modern-blue', name: 'MyQRCode Blue', color: '#4981ff', desc: 'Brand Default' },
                  { id: 'midnight-dark', name: 'Midnight Dark', color: '#0a0909', desc: 'Sleek & Bold' },
                  { id: 'sunset-coral', name: 'Sunset Coral', color: '#ff6b6b', desc: 'Warm & Inviting' },
                  { id: 'emerald-fresh', name: 'Emerald Green', color: '#16a34a', desc: 'Fresh & Organic' },
                  { id: 'ocean-breeze', name: 'Ocean Breeze', color: '#0284c7', desc: 'Crisp & Professional' },
                  { id: 'warm-amber', name: 'Warm Amber', color: '#d97706', desc: 'Artisan & Earthy' }
                ].map((t) => {
                  const isSelected = (data.design?.theme || 'modern-blue') === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleThemeChange(t.id as any)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-[#4981ff] bg-[#4981ff]/5 ring-1 ring-[#4981ff]'
                          : 'border-[#e3e5ed] hover:border-gray-300'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: t.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0a0909] truncate">
                          {t.name}
                        </div>
                        <div className="text-[10px] text-[#84868e] truncate">
                          {t.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0a0909] mb-2">
                Button Border Shape
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'rounded', label: 'Rounded (8px)', preview: 'rounded-xl' },
                  { id: 'pill', label: 'Pill (Full)', preview: 'rounded-full' },
                  { id: 'sharp', label: 'Sharp (0px)', preview: 'rounded-none' }
                ].map((b) => {
                  const isSelected = (data.design?.buttonStyle || 'rounded') === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleButtonStyleChange(b.id as any)}
                      className={`py-2 px-3 border text-xs font-bold text-center transition cursor-pointer ${
                        isSelected
                          ? 'border-[#4981ff] bg-[#4981ff]/10 text-[#4981ff]'
                          : 'border-[#e3e5ed] text-[#3f3e3e] hover:border-gray-300'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
