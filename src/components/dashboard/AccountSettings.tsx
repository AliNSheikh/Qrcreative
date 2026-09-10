import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { updateProfile, signOutUser } from '../../lib/supabase/client';
import { User, Mail, Lock, ShieldAlert, Check, AlertCircle } from 'lucide-react';

interface AccountSettingsProps {
  currentUser: UserProfile;
  onProfileUpdated: (name: string) => void;
  onAccountDeleted: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  currentUser,
  onProfileUpdated,
  onAccountDeleted
}) => {
  const [displayName, setDisplayName] = useState(currentUser.display_name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Delete account confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setUpdateError('Name cannot be empty.');
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const ok = await updateProfile(displayName.trim());
      if (ok) {
        onProfileUpdated(displayName.trim());
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      } else {
        setUpdateError('Could not update profile.');
      }
    } catch (err: any) {
      setUpdateError(err.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete my account') return;
    setIsDeleting(true);
    try {
      await signOutUser();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('qrcreative_auth_user');
      }
      onAccountDeleted();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Account Settings</h1>
        <p className="text-sm text-[#64748b] mt-1">
          Manage your personal profile and account credentials.
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs space-y-6">
        <h3 className="text-base font-bold text-[#111827]">Profile Information</h3>

        {updateSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-200">
            <Check className="w-4 h-4" />
            <span>Profile successfully updated.</span>
          </div>
        )}

        {updateError && (
          <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4" />
            <span>{updateError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-[#94a3b8]" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-sm text-[#111827] focus:border-[#6d5dfc] focus:ring-2 focus:ring-[#6d5dfc]/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#94a3b8]" />
              <input
                type="email"
                readOnly
                value={currentUser.email}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#64748b] cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-[#94a3b8] mt-1">
              Account email is associated with your unique QR collections.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6d5dfc] hover:bg-[#5a49ef] transition active:scale-[0.98] disabled:opacity-60"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-red-600">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-base font-bold text-[#111827]">Danger Zone</h3>
        </div>

        <p className="text-xs text-[#64748b] leading-relaxed">
          Deleting your account permanently removes your profile and all associated saved QR codes. Any active editable redirect links will cease functioning.
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition"
        >
          Delete Account
        </button>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#e2e8f0]">
            <h3 className="text-lg font-bold text-red-600 mb-2">
              Are you absolutely sure?
            </h3>
            <p className="text-xs text-[#64748b] leading-relaxed mb-4">
              This action cannot be undone. To confirm, please type <span className="font-bold text-[#111827]">delete my account</span> below.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete my account"
              className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 text-sm text-[#111827] outline-none mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting || deleteConfirmText.toLowerCase() !== 'delete my account'}
                onClick={handleConfirmDeleteAccount}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
