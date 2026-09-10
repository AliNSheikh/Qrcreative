import React from 'react';
import { Article } from '../../types';
import { BookOpen, Sparkles, Bell } from 'lucide-react';

interface ArticlesSectionProps {
  articles?: Article[];
  onCreateClick: () => void;
}

export const ArticlesSection: React.FC<ArticlesSectionProps> = ({ articles = [], onCreateClick }) => {
  return (
    <div id="articles" className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6d5dfc] bg-[#efedff] px-3 py-1 rounded-full">
          Knowledge & Guides
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight mt-3">
          Articles & Resources
        </h1>
        <p className="text-base text-[#64748b] mt-3 leading-relaxed">
          Best practices, technical printing specifications, and creative ideas for modern QR codes.
        </p>
      </div>

      {/* Strict zero-article empty state as required by Section 25 */}
      {articles.length === 0 ? (
        <div className="rounded-3xl border border-[#e2e8f0] bg-white p-12 sm:p-16 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#efedff] text-[#6d5dfc] flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-[#111827] tracking-tight">
            Articles are coming soon
          </h2>

          <p className="mt-3 text-sm text-[#64748b] leading-relaxed max-w-md mx-auto">
            We're preparing practical guides about QR codes, design, printing, and creative ways to use them.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onCreateClick}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6d5dfc] hover:bg-[#5a49ef] transition"
            >
              Create a Free QR Code
            </button>
          </div>
        </div>
      ) : (
        /* Future articles renderer structure */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((art) => (
            <article key={art.slug} className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xs">
              <h3 className="text-lg font-bold text-[#111827]">{art.title}</h3>
              <p className="text-xs text-[#64748b] mt-2">{art.description}</p>
              <div className="mt-4 text-xs text-[#94a3b8]">{art.author} · {new Date(art.publishedAt).toLocaleDateString()}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
