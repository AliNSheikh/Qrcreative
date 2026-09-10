import React from 'react';
import { Logo } from '../layout/Logo';
import { ArrowRight, Home } from 'lucide-react';

interface NotFoundViewProps {
  onGoHome: () => void;
  onCreateQR: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onGoHome, onCreateQR }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 py-16 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#e2e8f0] shadow-md space-y-6">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6d5dfc] bg-[#efedff] px-3 py-1 rounded-full">
            404 Error
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Page not found
          </h1>
          <p className="text-sm text-[#64748b] leading-relaxed">
            The page you requested doesn't exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onGoHome}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-[#111827] bg-white border border-[#cbd5e1] hover:bg-[#f8fafc] transition"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </button>
          <button
            onClick={onCreateQR}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6d5dfc] hover:bg-[#5a49ef] transition"
          >
            <span>Create QR</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
