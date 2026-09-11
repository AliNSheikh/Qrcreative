import React, { useState } from 'react';
import {
  signInWithEmail,
  signUpWithEmail,
  sendPasswordResetEmail,
  updateUserPassword,
  getCurrentUser
} from '../../lib/supabase/client';
import { UserProfile } from '../../types';
import {
  X,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { Logo } from '../layout/Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register' | 'forgot' | 'update_password';
  messagePrompt?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  messagePrompt
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'update_password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [directResetUrl, setDirectResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync mode if initialMode changes
  React.useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setDirectResetUrl(null);

    // 1. Password Reset Request Flow
    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      setLoading(true);
      try {
        const res = await sendPasswordResetEmail(email);
        if (res.success) {
          setSuccessMsg(res.message || `Password reset instructions dispatched to ${email}.`);
          if (res.recoveryLink) {
            setDirectResetUrl(res.recoveryLink);
          }
        } else {
          setError(res.error || 'Could not dispatch password reset link. Please verify your email.');
        }
      } catch (err: any) {
        setError(err.message || 'Password reset request failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Set New Password Flow
    if (mode === 'update_password') {
      if (!password) {
        setError('Please enter your new password.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const { success, error: err } = await updateUserPassword(password);
        if (err) {
          setError(err);
        } else if (success) {
          setSuccessMsg('Your password has been successfully updated! Signing you in...');
          const updated = await getCurrentUser();
          if (updated) {
            onSuccess(updated);
          }
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to update password');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. Register Flow
    if (mode === 'register') {
      if (!displayName.trim()) {
        setError('Please enter your name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!agreeTerms) {
        setError('Please agree to the Terms of Service and Privacy Policy.');
        return;
      }

      setLoading(true);
      try {
        const { user, error: err } = await signUpWithEmail(email, password, displayName);
        if (err) {
          setError(err);
        } else if (user) {
          onSuccess(user);
          onClose();
        }
      } catch (err: any) {
        setError(err.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      // 4. Login Flow
      if (!email.trim() || !password) {
        setError('Please fill in both email and password.');
        return;
      }

      setLoading(true);
      try {
        const { user, error: err } = await signInWithEmail(email, password);
        if (err) {
          setError(err);
        } else if (user) {
          onSuccess(user);
          onClose();
        }
      } catch (err: any) {
        setError(err.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#e2e8f0]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-[#94a3b8] hover:text-[#111827] hover:bg-[#f1f5f9] transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="md" />
          </div>

          {messagePrompt && (
            <div className="mb-4 p-3 rounded-xl bg-[#efedff] text-[#5a49ef] text-xs font-medium border border-[#6d5dfc]/20">
              {messagePrompt}
            </div>
          )}

          <h2 className="text-2xl font-bold text-[#111827] tracking-tight">
            {mode === 'login' && 'Sign in to your account'}
            {mode === 'register' && 'Create your free account'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'update_password' && 'Set new password'}
          </h2>
          <p className="mt-1 text-sm text-[#64748b]">
            {mode === 'login' && 'Access and edit all your saved QR codes anytime.'}
            {mode === 'register' && 'Save and edit dynamic QR codes for free with no limits.'}
            {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
            {mode === 'update_password' && 'Enter a secure new password for your account.'}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-800 border border-emerald-200">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-relaxed font-medium">{successMsg}</span>
            </div>
            {directResetUrl && (
              <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex flex-col items-center">
                <span className="text-[11px] text-emerald-700 mb-1.5">Direct Reset Link:</span>
                <a
                  href={directResetUrl}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6d5dfc] text-white text-xs font-semibold hover:bg-[#5a49ef] shadow-xs transition"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Click Here to Reset Password</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm text-[#111827] placeholder-[#94a3b8] focus:border-[#6d5dfc] focus:ring-2 focus:ring-[#6d5dfc]/20 outline-none transition"
                />
              </div>
            </div>
          )}

          {mode !== 'update_password' && (
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm text-[#111827] placeholder-[#94a3b8] focus:border-[#6d5dfc] focus:ring-2 focus:ring-[#6d5dfc]/20 outline-none transition"
                />
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#111827]">
                  {mode === 'update_password' ? 'New Password' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setDirectResetUrl(null);
                      setMode('forgot');
                    }}
                    className="text-xs text-[#6d5dfc] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#94a3b8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'update_password' ? 'At least 6 characters' : '••••••••'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#cbd5e1] text-sm text-[#111827] placeholder-[#94a3b8] focus:border-[#6d5dfc] focus:ring-2 focus:ring-[#6d5dfc]/20 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-2.5 p-1 rounded-md text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] transition focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {(mode === 'register' || mode === 'update_password') && (
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                {mode === 'update_password' ? 'Confirm New Password' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#94a3b8]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#cbd5e1] text-sm text-[#111827] placeholder-[#94a3b8] focus:border-[#6d5dfc] focus:ring-2 focus:ring-[#6d5dfc]/20 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-2.5 p-1 rounded-md text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] transition focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-[#cbd5e1] text-[#6d5dfc] focus:ring-[#6d5dfc]"
              />
              <label htmlFor="terms" className="text-xs text-[#64748b]">
                I agree to the <span className="text-[#111827] font-medium">Terms of Service</span> and <span className="text-[#111827] font-medium">Privacy Policy</span>.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#6d5dfc] hover:bg-[#5a49ef] shadow-md shadow-[#6d5dfc]/20 transition disabled:opacity-60 active:scale-[0.99]"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Create Free Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                  {mode === 'update_password' && 'Save New Password'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 pt-4 border-t border-[#f1f5f9] text-center text-xs text-[#64748b]">
          {mode === 'login' && (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setDirectResetUrl(null);
                  setMode('register');
                }}
                className="font-semibold text-[#6d5dfc] hover:underline"
              >
                Sign up free
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setDirectResetUrl(null);
                  setMode('login');
                }}
                className="font-semibold text-[#6d5dfc] hover:underline"
              >
                Sign in
              </button>
            </p>
          )}

          {(mode === 'forgot' || mode === 'update_password') && (
            <p>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setDirectResetUrl(null);
                  setMode('login');
                }}
                className="font-semibold text-[#6d5dfc] hover:underline"
              >
                Back to Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
