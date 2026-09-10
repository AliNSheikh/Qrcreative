import React from 'react';
import { MousePointerClick, Edit3, Palette, DownloadCloud } from 'lucide-react';

export const HowItWorks: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => {
  const steps = [
    {
      num: '1',
      icon: MousePointerClick,
      title: 'Choose your QR type',
      desc: 'Select URL, Wi-Fi, contact information, email, or any other supported format.'
    },
    {
      num: '2',
      icon: Edit3,
      title: 'Add your content',
      desc: 'Enter your destination link, text, or details into the straightforward input form.'
    },
    {
      num: '3',
      icon: Palette,
      title: 'Make it yours',
      desc: 'Customize colors, body patterns, corner styles, gradients, and upload your brand logo.'
    },
    {
      num: '4',
      icon: DownloadCloud,
      title: 'Download or save',
      desc: 'Download instant high-resolution PNGs and SVGs, or save to your account for future editing.'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-white border-t border-[#e2e8f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6d5dfc] bg-[#efedff] px-3 py-1 rounded-full">
            Quick Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight mt-3">
            How qrcreative Works
          </h2>
          <p className="text-base text-[#64748b] mt-3 leading-relaxed">
            Generate customized, scan-reliable QR codes in four simple steps without paying a single cent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, idx) => {
            const IconComp = s.icon;
            return (
              <div
                key={idx}
                className="relative p-6 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col items-start"
              >
                <div className="flex items-center justify-between w-full mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#6d5dfc] text-white flex items-center justify-center font-bold text-sm">
                    {s.num}
                  </div>
                  <IconComp className="w-5 h-5 text-[#64748b]" />
                </div>
                <h3 className="text-base font-bold text-[#111827]">
                  {s.title}
                </h3>
                <p className="text-xs text-[#64748b] mt-2 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={onCreateClick}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#6d5dfc] hover:bg-[#5a49ef] shadow-sm shadow-[#6d5dfc]/20 transition active:scale-[0.98]"
          >
            Start Creating Now
          </button>
        </div>
      </div>
    </section>
  );
};
