import React, { useState } from 'react';
import { User } from '../types';
import { StorageEngine } from '../lib/storage';
import { translations, Language } from '../lib/translations';
import { Mail, Lock, Shield, ArrowRight, Award, Zap, RefreshCw } from 'lucide-react';

interface AuthSectionProps {
  lang: Language;
  onLoginSuccess: (user: User) => void;
}

export default function AuthSection({ lang, onLoginSuccess }: AuthSectionProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (!email || !password) {
      setError(t.requiredFields);
      setIsSubmitting(false);
      return;
    }

    try {
      // Force fetch the latest data directly from Firestore before logging in or registering
      // to ensure we do not act on empty/stale localStorage or default dummy accounts
      await StorageEngine.forceFetchAllFromFirestore();
    } catch (err) {
      console.error("Error updating cache from Firestore:", err);
      setError(lang === 'ar' ? 'حدث خطأ أثناء الاتصال بقاعدة البيانات. الرجاء التحقق من جودة الاتصال بالإنترنت.' : 'Database connection error. Please check your internet connection.');
      setIsSubmitting(false);
      return;
    }

    const users = StorageEngine.getUsers();

    if (isLogin) {
      // Find user
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        // Verify password
        if (found.password && found.password !== password) {
          setError(lang === 'ar' ? 'كلمة المرور غير صحيحة!' : 'Incorrect password!');
          setIsSubmitting(false);
          return;
        }
        // If the user did not have a password set (e.g., initial migration accounts), save the entered one as default
        if (!found.password) {
          found.password = password;
          const updatedUsers = users.map(u => u.id === found.id ? found : u);
          try {
            await StorageEngine.saveUsers(updatedUsers);
          } catch (err) {
            setError(lang === 'ar' ? 'فشل حفظ كلمة المرور في قاعدة البيانات.' : 'Failed to save password to database.');
            setIsSubmitting(false);
            return;
          }
        }
        
        StorageEngine.setSessionUser(found);
        setSuccess(t.authSuccess);
        setTimeout(() => {
          onLoginSuccess(found);
        }, 800);
      } else {
        setError(t.authFailed);
        setIsSubmitting(false);
      }
    } else {
      // Register
      const exist = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exist) {
        setError(lang === 'ar' ? 'البريد الإلكتروني مسجل بالفعل!' : 'Email already registered!');
        setIsSubmitting(false);
        return;
      }

      // Generate random referral code
      const generatedCode = 'ALN' + Math.floor(1000 + Math.random() * 9000);

      // Handle referred by
      let referredByUserId: string | undefined = undefined;
      if (referralCodeInput.trim()) {
        const referrer = users.find(u => u.referralCode.toUpperCase() === referralCodeInput.trim().toUpperCase());
        if (referrer) {
          referredByUserId = referrer.id;
        } else {
          setError(lang === 'ar' ? 'كود الإحالة غير صحيح!' : 'Invalid referral code!');
          setIsSubmitting(false);
          return;
        }
      }

      const newUser: User = {
        id: 'u-' + Math.floor(100000 + Math.random() * 900000),
        email: email.toLowerCase(),
        password: password,
        points: referredByUserId ? 100 : 50, // bonus 50 points, or 100 points if referred!
        role: 'user',
        referralCode: generatedCode,
        referredBy: referredByUserId,
        createdAt: new Date().toISOString()
      };

      // Add to users list
      const updatedUsersList = [...users, newUser];

      try {
        // Save the new user first
        await StorageEngine.saveUsers(updatedUsersList);
      } catch (err: any) {
        console.error("Save users error during registration:", err);
        let detailedError = err instanceof Error ? err.message : String(err);
        try {
          const parsed = JSON.parse(detailedError);
          if (parsed && parsed.error) {
            detailedError = parsed.error;
          }
        } catch (e) {}
        setError(lang === 'ar' 
          ? `فشل التسجيل في قاعدة البيانات المشتركة: ${detailedError}` 
          : `Failed to register to shared database: ${detailedError}`
        );
        setIsSubmitting(false);
        return;
      }

      // Save referral transaction if any
      if (referredByUserId) {
        const referrals = StorageEngine.getReferrals();
        referrals.push({
          id: 'ref-' + Date.now(),
          referrerId: referredByUserId,
          referredUserId: newUser.id,
          rewardPoints: 50,
          createdAt: new Date().toISOString()
        });
        
        try {
          await StorageEngine.saveReferrals(referrals);
          
          // Update referrer's points
          const updatedUsers = updatedUsersList.map(u => {
            if (u.id === referredByUserId) {
              return { ...u, points: u.points + 50 };
            }
            return u;
          });
          await StorageEngine.saveUsers(updatedUsers);
        } catch (err) {
          console.error("Referral creation / point update warning (ignoring block):", err);
        }
      }

      StorageEngine.setSessionUser(newUser);
      setSuccess(t.authSuccess);
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main card */}
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl shadow-indigo-100/35 overflow-hidden z-10">
        <div className="p-8 pb-6 text-center">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl mb-4">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-indigo-950 mb-2">
            {t.logoTitle}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            {t.welcomeSub}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="px-8 mb-6">
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => { if (!isSubmitting) { setIsLogin(true); setError(''); } }}
              disabled={isSubmitting}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                isLogin ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/15' : 'text-slate-500 hover:text-slate-800'
              } ${isSubmitting ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              {t.login}
            </button>
            <button
              onClick={() => { if (!isSubmitting) { setIsLogin(false); setError(''); } }}
              disabled={isSubmitting}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                !isLogin ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/15' : 'text-slate-500 hover:text-slate-800'
              } ${isSubmitting ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              {t.register}
            </button>
          </div>
        </div>

        {/* Form container */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 text-xs rounded-xl text-center font-bold">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs rounded-xl text-center font-bold">
              {success}
            </div>
          )}

          <div>
            <label className="block text-slate-600 text-xs font-bold mb-1.5 px-1 text-right">
              {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder={lang === 'ar' ? 'example@mail.com' : 'example@mail.com'}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-bold mb-1.5 px-1 text-right">
              {lang === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-slate-600 text-xs font-bold mb-1.5 px-1 text-right">
                {lang === 'ar' ? 'كود الإحالة (اختياري)' : 'Referral Code (Optional)'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Award className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={referralCodeInput}
                  onChange={e => setReferralCodeInput(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm uppercase font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="e.g. ALNUAIMI"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 px-1 text-right">
                {lang === 'ar'
                  ? 'سجل بكود صديق للحصول على 50 نقطة إضافية ترحيبية فوراً!'
                  : 'Register using a friend\'s code to get 50 extra points instantly!'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 mt-2 group disabled:bg-indigo-400 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'ar' ? 'جاري الاتصال والتحقق...' : 'Verifying with server...'}</span>
              </>
            ) : (
              <>
                <span>{isLogin ? t.login : t.register}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>{t.securePrivacyNotice}</span>
        </div>
      </div>

      <div className="mt-8 text-center text-slate-400 text-xs">
        <p className="font-bold text-slate-500">{t.designerCredit}</p>
        <p className="mt-1 text-[10px] text-slate-400">© 2026 Al-Nuaimi Platform. All rights reserved.</p>
      </div>
    </div>
  );
}
