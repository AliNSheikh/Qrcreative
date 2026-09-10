import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is qrcreative free?',
      a: 'Yes, qrcreative is completely free. There are no paid plans, subscriptions, upgrades, or watermarks on downloaded files. Every feature is available without payment.'
    },
    {
      q: 'Do I need an account?',
      a: 'No account is required to generate and download static QR codes. You only need a free account if you want to save QR codes to your dashboard or create editable dynamic QR codes whose destination can be updated later.'
    },
    {
      q: 'Can I create a QR code without signing up?',
      a: 'Absolutely. You can select your QR type, enter your content, customize the design and colors, and immediately download PNG or SVG files without registering.'
    },
    {
      q: 'Can I edit my QR code later?',
      a: 'Yes! When you choose the "Editable / Dynamic" mode, your QR code points to a fast qrcreative redirect link (/r/slug). You can sign in to your dashboard anytime and update the target website URL without changing or reprinting the physical QR code.'
    },
    {
      q: "What's the difference between static and editable QR codes?",
      a: 'Static QR codes encode the raw payload directly into the matrix pattern. Once printed, their destination cannot be changed. Editable QR codes encode a redirect link that resolves through qrcreative, allowing the destination to be updated indefinitely in your account.'
    },
    {
      q: 'Can I add my logo to a QR code?',
      a: 'Yes. You can upload any PNG, SVG, or JPEG logo. When a logo is added, qrcreative automatically raises the error correction level to High (H) and wraps the logo in a protective badge to preserve reliable scanner readability.'
    },
    {
      q: 'Which download format should I use for printing?',
      a: 'For print materials like business cards, posters, product packaging, and billboards, we recommend vector SVG. SVG files scale infinitely without pixelation. For digital screens, emails, and presentations, PNG (at 1024px or 2048px) is ideal.'
    },
    {
      q: 'Do QR codes expire?',
      a: 'Static QR codes never expire because they contain the raw data directly. Editable QR codes remain active as long as your account remains open and you keep the code active in your dashboard.'
    },
    {
      q: 'What happens if I delete an editable QR code?',
      a: 'If you delete an editable QR code from your account, its redirect slug is deactivated and will display a clean "Not Found" notice. Existing printed copies will stop forwarding to the old destination.'
    },
    {
      q: 'Can I create Wi-Fi QR codes?',
      a: 'Yes. Select the Wi-Fi tab, enter your network name (SSID), password, and security type (WPA/WEP). When mobile devices scan the code, they will be prompted to join the network automatically.'
    },
    {
      q: 'Is my saved information private?',
      a: 'Yes. User accounts and saved QR records are secured with strict Row Level Security (RLS). Other users cannot see or modify your private codes.'
    },
    {
      q: 'Can I use qrcreative for commercial projects?',
      a: 'Yes! You are welcome to use qrcreative for commercial products, client branding, advertising, restaurants, events, and retail packaging without licensing fees.'
    }
  ];

  return (
    <section id="faq" className="py-16 md:py-24 bg-[#f8fafc] border-t border-[#e2e8f0]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6d5dfc] bg-[#efedff] px-3 py-1 rounded-full">
            Answers & Clarity
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight mt-3">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-[#64748b] mt-3">
            Everything you need to know about creating, printing, and managing free QR codes.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#e2e8f0] overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-[#111827]">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#64748b] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#6d5dfc]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-[#64748b] leading-relaxed border-t border-[#f1f5f9] pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
