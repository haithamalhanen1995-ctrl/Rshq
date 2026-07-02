import React, { useState, useEffect } from 'react';
import { User } from './types';
import { StorageEngine } from './lib/storage';
import { translations, Language } from './lib/translations';

// Subsections
import AuthSection from './components/AuthSection';
import HomeSection from './components/HomeSection';
import OrdersSection from './components/OrdersSection';
import ProfileSection from './components/ProfileSection';
import AdminSection from './components/AdminSection';
import ContactBtn from './components/ContactBtn';

// Icons
import { 
  Home, 
  ShoppingBag, 
  User as UserIcon, 
  ShieldAlert, 
  Languages, 
  HelpCircle, 
  MessageCircle, 
  Zap, 
  PlusCircle, 
  Lock 
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('ar');
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'profile'>('home');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  const t = translations[lang];

  useEffect(() => {
    // Force fetch all latest database collections on start to ensure localStorage is hydrated
    const initData = async () => {
      try {
        await StorageEngine.forceFetchAllFromFirestore();
      } catch (err) {
        console.error("Failed to hydrate data from Firestore on app launch:", err);
      } finally {
        setLoading(false);
      }
    };
    initData();

    // Initialize real-time synchronization with Firestore
    StorageEngine.initializeFirebaseSync(() => {
      handleRefreshData();
    });
  }, []);

  useEffect(() => {
    // Check session on load
    if (!loading) {
      const loggedUser = StorageEngine.getSessionUser();
      if (loggedUser) {
        setUser(loggedUser);
      }
    }
  }, [refreshTrigger, loading]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setActiveTab('home');
    setShowAdminPanel(false);
  };

  const handleLogout = () => {
    StorageEngine.setSessionUser(null);
    setUser(null);
    setShowAdminPanel(false);
  };

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleRefreshData = () => {
    // Trigger redraw for balances or order modifications
    setRefreshTrigger(prev => prev + 1);
  };

  // While fetching from Firestore for the first time, show high-fidelity loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        {/* Decorative Blur Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-indigo-100/35 text-center z-10 flex flex-col items-center gap-4 animate-pulse">
          <div className="p-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl">
            <Zap className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-lg font-black text-indigo-950 mt-2">
            {lang === 'ar' ? 'النعيمي لخدمات الـ SMM والألعاب' : 'Al-Nuaimi SMM & Game Services'}
          </h2>
          <p className="text-xs text-slate-500 font-bold">
            {lang === 'ar' ? 'جاري الاتصال بقاعدة البيانات السحابية وتحديث الحسابات...' : 'Connecting to Cloud Firestore and refreshing database...'}
          </p>
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mt-2"></div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, display Auth flow
  if (!user) {
    return (
      <div className="bg-slate-50 min-h-screen relative text-right">
        {/* Absolute Language toggle on Login screen */}
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold shadow-sm transition-all"
          >
            <Languages className="w-4 h-4 text-indigo-600" />
            <span>{t.langToggle}</span>
          </button>
        </div>
        <AuthSection lang={lang} onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-800 font-sans relative flex flex-col justify-between antialiased">
      {/* Absolute Decorative elements */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col px-4 pt-4 md:pt-6">
        
        {/* Header Navigation Section */}
        <header 
          className="bg-white/95 backdrop-blur-md border border-slate-100 shadow-md shadow-indigo-100/30 rounded-3xl p-4 md:p-5 flex items-center justify-between mb-6 z-20 sticky top-4"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Left side actions (Language & Admin panel trigger if eligible) */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition-all"
            >
              <Languages className="w-4 h-4 text-indigo-600" />
              <span>{t.langToggle}</span>
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                  showAdminPanel 
                    ? 'bg-rose-600 text-white border-rose-500 shadow shadow-rose-500/10' 
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200/50'
                }`}
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>{showAdminPanel ? (lang === 'ar' ? 'الرئيسية' : 'Exit Admin') : t.adminPanel}</span>
              </button>
            )}
          </div>

          {/* Right side logo */}
          <div className="text-right flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <h1 className="text-base font-black text-indigo-950 leading-none">
                {t.logoTitle}
              </h1>
              <span className="text-[10px] text-slate-500 font-bold block mt-1">
                {t.logoSub}
              </span>
            </div>
            <div className="inline-flex p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl shadow-inner">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </header>

        {/* Core content slot */}
        <main className="flex-1 z-10">
          {showAdminPanel && user.role === 'admin' ? (
            <AdminSection 
              lang={lang} 
              onRefreshParent={handleRefreshData} 
              refreshTrigger={refreshTrigger}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeSection 
                  lang={lang} 
                  user={user} 
                  onOrderPlaced={handleRefreshData} 
                />
              )}
              {activeTab === 'orders' && (
                <OrdersSection 
                  lang={lang} 
                  user={user} 
                  refreshTrigger={refreshTrigger} 
                />
              )}
              {activeTab === 'profile' && (
                <ProfileSection 
                  lang={lang} 
                  user={user} 
                  onLogout={handleLogout} 
                  onPointsUpdate={handleRefreshData} 
                  refreshTrigger={refreshTrigger}
                />
              )}
            </>
          )}
        </main>

        {/* Professional designer footer credit always visible */}
        <footer className="text-center py-6 text-[11px] text-slate-400 mt-8 border-t border-slate-200/50 space-y-1">
          <p className="font-bold tracking-wider text-slate-500 uppercase">
            {t.designerCredit}
          </p>
          <p className="font-mono text-[9px] text-slate-400">
            {lang === 'ar' 
              ? 'بوابة رشق المتابعين وشحن الألعاب المؤتمتة المتكاملة - إصدار 2026.1' 
              : 'Durable Automated SMM & Esports Distribution - v2026.1'}
          </p>
        </footer>
      </div>

      {/* Floating Customer Helpdesk button */}
      <ContactBtn lang={lang} />

      {/* Persistent Bottom Tab Navigation Bar */}
      {!showAdminPanel && (
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 z-45 py-2.5 shadow-2xl shadow-indigo-100 px-4 md:px-12 flex items-center justify-around"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Tab 1: Home */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 py-1.5 rounded-2xl ${
              activeTab === 'home' 
                ? 'text-indigo-600 font-extrabold scale-105 bg-indigo-50/80 mx-1.5' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">{t.navHome}</span>
          </button>

          {/* Tab 2: Orders */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 py-1.5 rounded-2xl ${
              activeTab === 'orders' 
                ? 'text-indigo-600 font-extrabold scale-105 bg-indigo-50/80 mx-1.5' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">{t.navOrders}</span>
          </button>

          {/* Tab 3: Account */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 py-1.5 rounded-2xl ${
              activeTab === 'profile' 
                ? 'text-indigo-600 font-extrabold scale-105 bg-indigo-50/80 mx-1.5' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">{t.navProfile}</span>
          </button>
        </nav>
      )}
    </div>
  );
}
