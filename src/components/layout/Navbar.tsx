import React, { useState } from 'react';
import { Logo } from './Logo';
import { UserProfile } from '../../types';
import { PlusCircle, LayoutDashboard, LogOut, Settings, User, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onSignOut: () => void;
  currentView: string;
  onNavigate: (view: string, subParam?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onSignOut,
  currentView,
  onNavigate
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Create QR', view: 'create' },
    { label: 'QR Types', view: 'qr-types' },
    { label: 'Features', view: 'features' },
    { label: 'How It Works', view: 'how-it-works' },
    { label: 'Articles', view: 'articles' },
    { label: 'FAQ', view: 'faq' }
  ];

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e2e8f0] bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => handleNavClick('home')}
          className="focus:outline-none focus:ring-2 focus:ring-[#6d5dfc] rounded-lg p-1 transition"
          aria-label="qrcreative Home"
        >
          <Logo />
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = currentView === link.view;
            return (
              <button
                key={link.view}
                onClick={() => handleNavClick(link.view)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'text-[#6d5dfc] bg-[#efedff]'
                    : 'text-[#64748b] hover:text-[#111827] hover:bg-[#f1f5f9]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  currentView === 'dashboard'
                    ? 'bg-[#efedff] text-[#6d5dfc]'
                    : 'text-[#111827] hover:bg-[#f1f5f9]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#6d5dfc]" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => handleNavClick('create')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#6d5dfc] hover:bg-[#5a49ef] shadow-sm shadow-[#6d5dfc]/20 transition active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create QR</span>
              </button>

              {/* User Avatar & Dropdown */}
              <div className="relative ml-1">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-[#e2e8f0] hover:bg-[#f8fafc] transition focus:outline-none"
                  aria-label="User menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6d5dfc] to-[#13b8a6] flex items-center justify-center text-white text-xs font-bold">
                    {currentUser.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-[#111827] max-w-[100px] truncate">
                    {currentUser.display_name}
                  </span>
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#e2e8f0] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-[#f1f5f9]">
                      <p className="text-xs text-[#64748b]">Signed in as</p>
                      <p className="text-sm font-semibold text-[#111827] truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        handleNavClick('dashboard');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#111827] hover:bg-[#f8fafc] flex items-center gap-2.5 transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#64748b]" />
                      My QR Codes
                    </button>

                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onNavigate('settings');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#111827] hover:bg-[#f8fafc] flex items-center gap-2.5 transition"
                    >
                      <Settings className="w-4 h-4 text-[#64748b]" />
                      Account Settings
                    </button>

                    <div className="border-t border-[#f1f5f9] mt-1 pt-1">
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#ef4444] hover:bg-red-50 flex items-center gap-2.5 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-[#111827] hover:bg-[#f1f5f9] transition"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavClick('create')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#6d5dfc] hover:bg-[#5a49ef] shadow-sm shadow-[#6d5dfc]/20 transition active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Free QR</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {currentUser && (
            <button
              onClick={() => handleNavClick('dashboard')}
              className="p-1.5 text-[#6d5dfc] bg-[#efedff] rounded-lg"
              aria-label="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg text-[#64748b] hover:text-[#111827] hover:bg-[#f1f5f9] focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden border-b border-[#e2e8f0] bg-white px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.view}
              onClick={() => handleNavClick(link.view)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-base font-medium transition ${
                currentView === link.view
                  ? 'text-[#6d5dfc] bg-[#efedff]'
                  : 'text-[#111827] hover:bg-[#f8fafc]'
              }`}
            >
              {link.label}
            </button>
          ))}

          <div className="pt-3 border-t border-[#f1f5f9] space-y-2">
            {currentUser ? (
              <>
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-base font-semibold text-[#111827] bg-[#f8fafc]"
                >
                  <LayoutDashboard className="w-5 h-5 text-[#6d5dfc]" />
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-base text-[#64748b]"
                >
                  <Settings className="w-5 h-5" />
                  Account Settings
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-base text-[#ef4444]"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-[#111827] border border-[#e2e8f0] rounded-xl hover:bg-[#f8fafc]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-[#6d5dfc] rounded-xl shadow-sm hover:bg-[#5a49ef]"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
