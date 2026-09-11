import React, { useState, useEffect } from 'react';
import { UserProfile, QRCodeRecord, QRCodeType } from './types';
import { getCurrentUser, signOutUser, onAuthPasswordRecovery } from './lib/supabase/client';
import { fetchRuntimeConfig } from './lib/config';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/marketing/Hero';
import { QRGenerator } from './components/qr/QRGenerator';
import { FeaturesSection } from './components/marketing/FeaturesSection';
import { QRTypesSection } from './components/marketing/QRTypesSection';
import { HowItWorks } from './components/marketing/HowItWorks';
import { ArticlesSection } from './components/marketing/ArticlesSection';
import { FAQSection } from './components/marketing/FAQSection';
import { MyQRCodes } from './components/dashboard/MyQRCodes';
import { QRDetailView } from './components/dashboard/QRDetailView';
import { AccountSettings } from './components/dashboard/AccountSettings';
import { LegalViews } from './components/marketing/LegalViews';
import { NotFoundView } from './components/marketing/NotFoundView';
import { AuthModal } from './components/auth/AuthModal';
import { CheckCircle2, Bookmark } from 'lucide-react';

export function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'forgot' | 'update_password'>('login');
  const [authPromptMessage, setAuthPromptMessage] = useState<string | undefined>();

  // Router View State
  const [currentView, setCurrentView] = useState<string>('home');
  const [preselectedType, setPreselectedType] = useState<QRCodeType>('url');

  // Detail & Edit State
  const [selectedDetailQR, setSelectedDetailQR] = useState<QRCodeRecord | null>(null);
  const [editingQR, setEditingQR] = useState<QRCodeRecord | null>(null);

  // Global Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize Session
  useEffect(() => {
    async function initSession() {
      try {
        await fetchRuntimeConfig();
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Session init error:', err);
      }
    }
    initSession();

    // Check if URL has a password recovery hash or query
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        setAuthInitialMode('update_password');
        setAuthPromptMessage('Please enter a new password to complete account recovery.');
        setAuthModalOpen(true);
      }

      // Check if URL has a hash or query route
      const path = window.location.pathname.replace(/^\//, '');
      if (path === 'create') setCurrentView('create');
      else if (path === 'dashboard') setCurrentView('dashboard');
      else if (path === 'articles') setCurrentView('articles');
      else if (path === 'features') setCurrentView('features');
      else if (path === 'qr-types') setCurrentView('qr-types');
      else if (path === 'how-it-works') setCurrentView('how-it-works');
      else if (path === 'faq') setCurrentView('faq');
      else if (path === 'privacy') setCurrentView('privacy');
      else if (path === 'terms') setCurrentView('terms');
    }

    const unsubscribeRecovery = onAuthPasswordRecovery(() => {
      setAuthInitialMode('update_password');
      setAuthPromptMessage('Please enter a new password to complete account recovery.');
      setAuthModalOpen(true);
    });

    return () => {
      unsubscribeRecovery();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenAuth = (mode: 'login' | 'register' | 'forgot' | 'update_password' = 'login', promptMsg?: string) => {
    setAuthInitialMode(mode);
    setAuthPromptMessage(promptMsg);
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setCurrentView('home');
    showToast('Signed out successfully.');
  };

  const handleNavigate = (view: string) => {
    // If navigating to dashboard without login, prompt login
    if (view === 'dashboard' && !currentUser) {
      handleOpenAuth('login', 'Please sign in to access your personal QR dashboard.');
      return;
    }

    if (view === 'create') {
      setEditingQR(null);
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQRSaved = (saved: QRCodeRecord) => {
    showToast(`QR Code "${saved.name}" saved successfully!`);
    setCurrentView('dashboard');
  };

  const handleEditQR = (qr: QRCodeRecord) => {
    setEditingQR(qr);
    setCurrentView('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (qr: QRCodeRecord) => {
    setSelectedDetailQR(qr);
    setCurrentView('qr-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTypeFromShowcase = (type: QRCodeType) => {
    setPreselectedType(type);
    setEditingQR(null);
    setCurrentView('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#111827]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#111827] text-white text-xs font-semibold shadow-xl border border-white/10 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#13b8a6]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Sticky Navigation */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={(mode) => handleOpenAuth(mode || 'login')}
        onSignOut={handleSignOut}
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {/* 1. HOME VIEW */}
        {currentView === 'home' && (
          <div>
            <Hero
              onCreateClick={() => handleNavigate('create')}
              onViewTypesClick={() => handleNavigate('qr-types')}
            />

            {/* Central Generator Workspace Section */}
            <section className="py-8 bg-white border-t border-b border-[#e2e8f0]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6d5dfc] bg-[#efedff] px-3 py-1 rounded-full">
                  Free QR Studio
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-2">
                  Create & Customize Your QR Code
                </h2>
              </div>

              <QRGenerator
                currentUser={currentUser}
                onOpenAuth={(prompt) => handleOpenAuth('register', prompt)}
                onQRSaved={handleQRSaved}
                editingQR={null}
                initialType={preselectedType}
              />
            </section>

            <QRTypesSection onSelectType={handleSelectTypeFromShowcase} />
            <FeaturesSection />
            <HowItWorks onCreateClick={() => handleNavigate('create')} />
            <FAQSection />
          </div>
        )}

        {/* 2. CREATE QR WORKSPACE VIEW */}
        {currentView === 'create' && (
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                {editingQR ? `Edit QR Code: ${editingQR.name}` : 'Free QR Code Generator'}
              </h1>
              <p className="text-xs sm:text-sm text-[#64748b] mt-1">
                {editingQR
                  ? 'Update styling, colors, or destination without altering physical QR codes.'
                  : 'Design custom QR codes with patterns, colors, and dynamic redirects.'}
              </p>
            </div>

            <QRGenerator
              currentUser={currentUser}
              onOpenAuth={(prompt) => handleOpenAuth('register', prompt)}
              onQRSaved={handleQRSaved}
              editingQR={editingQR}
              onCancelEdit={() => {
                setEditingQR(null);
                setCurrentView(currentUser ? 'dashboard' : 'home');
              }}
              initialType={preselectedType}
            />
          </div>
        )}

        {/* 3. USER DASHBOARD / MY QR CODES VIEW */}
        {currentView === 'dashboard' && currentUser && (
          <MyQRCodes
            currentUser={currentUser}
            onCreateNew={() => {
              setEditingQR(null);
              setCurrentView('create');
            }}
            onEditQR={handleEditQR}
            onViewDetails={handleViewDetails}
          />
        )}

        {/* 4. QR DETAIL VIEW */}
        {currentView === 'qr-details' && selectedDetailQR && (
          <QRDetailView
            qr={selectedDetailQR}
            onBack={() => setCurrentView('dashboard')}
            onEdit={handleEditQR}
            onDuplicate={async (qr) => {
              handleNavigate('dashboard');
              showToast(`Duplicated "${qr.name}"`);
            }}
            onDelete={async (qr) => {
              handleNavigate('dashboard');
              showToast(`Deleted "${qr.name}"`);
            }}
          />
        )}

        {/* 5. QR TYPES SHOWCASE */}
        {currentView === 'qr-types' && (
          <div className="py-6">
            <QRTypesSection onSelectType={handleSelectTypeFromShowcase} />
          </div>
        )}

        {/* 6. FEATURES SHOWCASE */}
        {currentView === 'features' && (
          <div className="py-6">
            <FeaturesSection />
          </div>
        )}

        {/* 7. HOW IT WORKS */}
        {currentView === 'how-it-works' && (
          <div className="py-6">
            <HowItWorks onCreateClick={() => handleNavigate('create')} />
          </div>
        )}

        {/* 8. ARTICLES (Strictly zero articles with elegant coming-soon state) */}
        {currentView === 'articles' && (
          <ArticlesSection
            articles={[]}
            onCreateClick={() => handleNavigate('create')}
          />
        )}

        {/* 9. FAQ */}
        {currentView === 'faq' && (
          <div className="py-6">
            <FAQSection />
          </div>
        )}

        {/* 10. ACCOUNT SETTINGS */}
        {currentView === 'settings' && currentUser && (
          <AccountSettings
            currentUser={currentUser}
            onProfileUpdated={(name) => {
              setCurrentUser(prev => prev ? { ...prev, display_name: name } : null);
              showToast('Profile updated.');
            }}
            onAccountDeleted={() => {
              setCurrentUser(null);
              setCurrentView('home');
              showToast('Account permanently deleted.');
            }}
          />
        )}

        {/* 11. PRIVACY POLICY */}
        {currentView === 'privacy' && (
          <LegalViews type="privacy" onBack={() => handleNavigate('home')} />
        )}

        {/* 12. TERMS OF SERVICE */}
        {currentView === 'terms' && (
          <LegalViews type="terms" onBack={() => handleNavigate('home')} />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => handleOpenAuth(mode)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        messagePrompt={authPromptMessage}
        onSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome, ${user.display_name}!`);
        }}
      />
    </div>
  );
}

export default App;
