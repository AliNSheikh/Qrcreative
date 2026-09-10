import React, { useRef, useEffect } from 'react';
import { renderQRToCanvas } from '../../lib/qr/generator';
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

interface HeroProps {
  onCreateClick: () => void;
  onViewTypesClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onCreateClick, onViewTypesClick }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderQRToCanvas(
      canvasRef.current,
      'https://qrcreative.app',
      {
        template: 'creative',
        dotStyle: 'rounded',
        cornerSquareStyle: 'extra-rounded',
        cornerDotStyle: 'dot',
        foregroundColor: '#6d5dfc',
        backgroundColor: '#ffffff',
        gradient: {
          enabled: true,
          type: 'linear',
          color2: '#13b8a6',
          angle: 60
        },
        logo: {
          url: null,
          size: 22,
          padding: 8,
          shape: 'square'
        },
        margin: 3,
        errorCorrectionLevel: 'M'
      },
      400
    );
  }, []);

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#6d5dfc]/10 to-[#13b8a6]/10 blur-3xl pointer-events-none -z-10 rounded-full"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Copy (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#efedff] border border-[#6d5dfc]/20 text-[#5a49ef] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Completely Free · No Subscriptions · No Watermarks</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111827] tracking-tight leading-[1.12]">
              Create QR codes that look as{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6d5dfc] via-[#5a49ef] to-[#13b8a6]">
                good as they work.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#64748b] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Create, customize, save and update beautiful QR codes for free with qrcreative. Generate editable codes that update without reprinting, export print-ready vector SVGs, and organize your creations.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onCreateClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-base font-bold text-white bg-[#6d5dfc] hover:bg-[#5a49ef] shadow-lg shadow-[#6d5dfc]/25 hover:shadow-xl transition active:scale-[0.98]"
              >
                <span>Create QR Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onViewTypesClick}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-base font-semibold text-[#111827] bg-white border border-[#cbd5e1] hover:bg-[#f8fafc] transition"
              >
                View QR Types
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-[#64748b]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#13b8a6]" />
                <span>Free to use</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#13b8a6]" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#13b8a6]" />
                <span>Download instantly</span>
              </div>
            </div>
          </div>

          {/* Right Interactive Mockup (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 sm:p-8 border border-[#e2e8f0] shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#13b8a6]/15 text-[#0f766e]">
                  Dynamic Preview
                </span>
              </div>

              {/* Mockup Canvas */}
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center shadow-inner">
                <canvas ref={canvasRef} className="w-52 h-52 sm:w-60 sm:h-60 rounded-xl" />
              </div>

              {/* Mockup Stats */}
              <div className="flex items-center justify-between text-xs text-[#64748b] pt-1">
                <div>
                  <p className="font-semibold text-[#111827]">qrcreative.app/r/demo</p>
                  <p className="text-[11px] text-[#94a3b8]">Editable Dynamic Redirect</p>
                </div>
                <button
                  onClick={onCreateClick}
                  className="px-3 py-1.5 rounded-xl bg-[#efedff] text-[#6d5dfc] font-bold text-xs hover:bg-[#e4e1ff] transition"
                >
                  Try Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
