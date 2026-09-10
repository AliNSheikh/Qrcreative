import React from 'react';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

interface LegalViewProps {
  type: 'privacy' | 'terms';
  onBack: () => void;
}

export const LegalViews: React.FC<LegalViewProps> = ({ type, onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-[#64748b] hover:text-[#111827] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#e2e8f0] shadow-xs space-y-8 text-[#334155] leading-relaxed text-sm">
        {type === 'privacy' ? (
          <>
            <div className="space-y-2 border-b border-[#e2e8f0] pb-6">
              <div className="inline-flex items-center gap-2 text-[#6d5dfc] font-bold text-xs">
                <Shield className="w-4 h-4" />
                <span>Privacy First</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-xs text-[#94a3b8]">
                Last updated: January 2026 · qrcreative
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[#111827]">1. Information We Collect</h2>
              <p>
                qrcreative is built with data minimization as a core principle. We only collect the minimal information necessary to provide you with free QR generation and management services:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account Information:</strong> When you register an optional free account, we collect your email address and preferred display name for authentication purposes.</li>
                <li><strong>Saved QR Content:</strong> Information you explicitly enter into our generator (such as URLs, contact card details, or Wi-Fi configurations) so that your account can store and manage them.</li>
                <li><strong>Dynamic Scan Logs:</strong> For editable dynamic QR codes, our redirect server logs standard HTTP metadata: timestamp, general device category (mobile, tablet, or desktop), and referrer. We do not track precise GPS locations or invasively fingerprint users.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[#111827]">2. How We Use Your Data</h2>
              <p>
                We use collected information solely to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Allow you to access, edit, and export your saved QR codes.</li>
                <li>Forward scanners from dynamic redirect links (<code>/r/slug</code>) to your designated destination URL.</li>
                <li>Display aggregate scan counters in your personal dashboard.</li>
              </ul>
              <p>
                We do not sell your personal information or use it for cross-site behavioral advertising.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[#111827]">3. Data Security & Storage</h2>
              <p>
                Your account data is protected with database-level Row Level Security (RLS). You retain full ownership of your data, and you may permanently delete your account and its saved codes at any time from your Account Settings.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[#111827]">4. Contact</h2>
              <p>
                If you have inquiries regarding privacy or your stored data, you may reach out to support@qrcreative.app.
              </p>
            </section>
          </>
        ) : (
          <>
            <div className="space-y-2 border-b border-[#e2e8f0] pb-6">
              <div className="inline-flex items-center gap-2 text-[#6d5dfc] font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>Terms of Use</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
                Terms of Service
              </h1>
              <p className="text-xs text-[#94a3b8]">
                Last updated: January 2026 · qrcreative
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[#111827]">1. Acceptance of Terms</h2>
              <p>
                By using qrcreative (the "Service"), you agree to abide by these Terms of Service. If you disagree with any part of these terms, you should not use the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[#111827]">2. Free Service and No Warranties</h2>
              <p>
                qrcreative is provided as a 100% free platform without subscription fees. The service is provided "as is" and "as available," without warranties of any kind, whether express or implied.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[#111827]">3. Acceptable Use Policy</h2>
              <p>
                You are solely responsible for all content, links, and destinations you encode into QR codes or configure in dynamic redirects. You agree NOT to use the Service for:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Phishing, malware distribution, credential harvesting, or deceptive links.</li>
                <li>Hate speech, harassment, illegal products, or infringing copyrighted materials.</li>
                <li>Unsafe URI schemes (e.g. <code>javascript:</code>, <code>data:</code>) intended to compromise scanning devices.</li>
              </ul>
              <p>
                We reserve the right to immediately deactivate any QR code or account found to violate this policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[#111827]">4. External Destinations</h2>
              <p>
                qrcreative has no control over third-party websites or services linked to by QR codes. We do not guarantee the continued existence, reliability, or safety of external destinations.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-[#111827]">5. Account Termination</h2>
              <p>
                You may terminate your account at any time via Account Settings. Doing so permanently disables all associated editable redirect links.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
