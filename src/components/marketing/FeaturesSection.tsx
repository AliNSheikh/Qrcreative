import React from 'react';
import {
  Sparkles,
  Palette,
  RefreshCw,
  Download,
  LayoutDashboard,
  ShieldCheck,
  Check
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'Completely free',
      desc: 'No premium tiers, subscriptions, paywalls, or checkout systems inside qrcreative. Every feature is unrestricted for all users.'
    },
    {
      icon: Palette,
      title: 'Custom designs',
      desc: 'Control body patterns, corner square styles, corner dots, gradients, and custom center logo placement with automatic error correction.'
    },
    {
      icon: RefreshCw,
      title: 'Editable QR codes',
      desc: 'Create dynamic QR codes whose destination webpage can be edited anytime without having to reprint the physical QR code.'
    },
    {
      icon: Download,
      title: 'Free downloads',
      desc: 'Download high-resolution PNG files (up to 2048px) and vector SVGs ready for professional printing, completely unwatermarked.'
    },
    {
      icon: LayoutDashboard,
      title: 'Personal dashboard',
      desc: 'Organize, search, filter, duplicate, and manage all your creations in one intuitive place with quick one-click actions.'
    },
    {
      icon: ShieldCheck,
      title: 'Privacy-conscious',
      desc: 'We collect only the bare minimum operational data needed to authenticate your account and route your dynamic QR redirects.'
    }
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-white border-t border-b border-[#e2e8f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6d5dfc] bg-[#efedff] px-3 py-1 rounded-full">
            Product Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight mt-3">
            Designed for creativity, reliability, and speed.
          </h2>
          <p className="text-base text-[#64748b] mt-3 leading-relaxed">
            Everything you need to craft stunning QR codes for personal projects, businesses, events, and print media.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#6d5dfc]/30 hover:bg-white hover:shadow-md transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-center text-[#6d5dfc] group-hover:scale-105 transition shadow-2xs">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#111827] mt-5">
                  {item.title}
                </h3>
                <p className="text-sm text-[#64748b] mt-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
