import React from 'react';
import { Logo } from './Logo';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAuth }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e2e8f0] bg-white text-[#64748b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-sm text-[#64748b] leading-relaxed max-w-sm">
              Free, modern QR code creation and management platform. Design customizable, vector-sharp QR codes with dynamic destination updates and zero subscriptions.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-[#94a3b8]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#13b8a6]"></span>
              <span>100% Free · No credit card required</span>
            </div>
          </div>

          {/* qrcreative */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#111827] tracking-wider uppercase">qrcreative</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('create')}
                  className="hover:text-[#6d5dfc] transition"
                >
                  Create QR
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('qr-types')}
                  className="hover:text-[#6d5dfc] transition"
                >
                  QR Types
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('features')}
                  className="hover:text-[#6d5dfc] transition"
                >
                  Features
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#111827] tracking-wider uppercase">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="hover:text-[#6d5dfc] transition"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('articles')}
                  className="hover:text-[#6d5dfc] transition"
                >
                  Articles
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('faq')}
                  className="hover:text-[#6d5dfc] transition"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Account */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#111827] tracking-wider uppercase">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-[#6d5dfc] transition"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="hover:text-[#6d5dfc] transition"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="hover:text-[#6d5dfc] transition"
                >
                  Sign In
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="hover:text-[#6d5dfc] transition"
                >
                  Create Account
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94a3b8]">
          <p>© {currentYear} qrcreative. All rights reserved.</p>
          <p className="text-center sm:text-right">
            QR Code is a registered trademark of DENSO WAVE INCORPORATED.
          </p>
        </div>
      </div>
    </footer>
  );
};
