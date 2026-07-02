import React, { useState, useEffect } from 'react';
import { User, PaymentRequest } from '../types';
import { StorageEngine } from '../lib/storage';
import { translations, Language } from '../lib/translations';
import { 
  User as UserIcon, 
  CreditCard, 
  Award, 
  Copy, 
  AlertCircle, 
  CheckCircle, 
  ShieldCheck, 
  DollarSign, 
  HelpCircle, 
  ChevronRight, 
  LogOut 
} from 'lucide-react';

interface ProfileSectionProps {
  lang: Language;
  user: User;
  onLogout: () => void;
  onPointsUpdate: () => void;
  refreshTrigger?: number;
}

export default function ProfileSection({ lang, user, onLogout, onPointsUpdate, refreshTrigger }: ProfileSectionProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [amountCash, setAmountCash] = useState<number>(10);
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Rafidain Master');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [referralsCount, setReferralsCount] = useState(0);
  const [pastPayments, setPastPayments] = useState<PaymentRequest[]>([]);

  // Password edit states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPwInput, setNewPwInput] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const t = translations[lang];

  useEffect(() => {
    // Load referrals and past payments
    const allRefs = StorageEngine.getReferrals();
    const userRefs = allRefs.filter(r => r.referrerId === user.id);
    setReferralsCount(userRefs.length);

    const allPayments = StorageEngine.getPaymentRequests();
    const userPayments = allPayments.filter(p => p.userId === user.id);
    userPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setPastPayments(userPayments);
  }, [user.id, success, refreshTrigger]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (amountCash < 1) {
      setError(t.paymentMinError);
      return;
    }

    const autoTxnId = 'DEP-' + Math.floor(100000 + Math.random() * 900000);

    const newRequest: PaymentRequest = {
      id: 'pay-' + Math.floor(100000 + Math.random() * 900000),
      userId: user.id,
      userEmail: user.email,
      amountPoints: amountCash * 100, // 100 points per dollar
      amountCash: amountCash,
      method: paymentMethod,
      transactionId: autoTxnId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const payments = StorageEngine.getPaymentRequests();
    payments.push(newRequest);
    StorageEngine.savePaymentRequests(payments);

    setSuccess(t.paymentSuccess);
    setTransactionId('');
    onPointsUpdate();
  };

  const handleUserPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!newPwInput.trim()) {
      setPwError(lang === 'ar' ? 'يرجى كتابة كلمة مرور صالحة!' : 'Please enter a valid password!');
      return;
    }

    const users = StorageEngine.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index].password = newPwInput.trim();
      StorageEngine.saveUsers(users);

      // Refresh parent session user
      const updatedUser = users[index];
      StorageEngine.setSessionUser(updatedUser);

      setPwSuccess(lang === 'ar' ? 'تم تحديث كلمة المرور بنجاح!' : 'Password changed successfully!');
      setNewPwInput('');
      onPointsUpdate();
    } else {
      setPwError(lang === 'ar' ? 'حدث خطأ غير متوقع!' : 'An unexpected error occurred!');
    }
  };

  const methods = [
    { name: 'Rafidain Master', ar: 'ماستر كارد الرافدين', desc: 'شحن وتعبئة الرصيد مباشرة عبر بطاقة ماستر كارد الرافدين' },
    { name: 'Binance TRC20', ar: 'بينانس (Binance TRC20)', desc: 'دفع فوري آمن ومباشر عبر شبكة Tron TRC-20' },
    { name: 'Binance Polygon', ar: 'بينانس (Binance Polygon)', desc: 'دفع فوري آمن ومباشر عبر شبكة Polygon MATIC' }
  ];

  return (
    <div className="space-y-6 pb-24 text-right animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Account Info Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 text-right">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 text-indigo-600 shadow-inner">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-indigo-950 text-lg">{user.email}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border ${
                  user.role === 'admin' 
                    ? 'bg-rose-50 text-rose-600 border-rose-100' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}>
                  {user.role === 'admin' ? t.adminPanel : (lang === 'ar' ? 'عضو' : 'Member')}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                {lang === 'ar' ? 'تاريخ التسجيل:' : 'Member Since:'} {new Date(user.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 transition-all text-xs font-bold flex items-center gap-2 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logout}</span>
          </button>
        </div>

        {/* Change password subsection */}
        <div className="mt-6 pt-6 border-t border-slate-100/80 relative z-10 text-right">
          <button
            onClick={() => {
              setShowChangePassword(!showChangePassword);
              setPwError('');
              setPwSuccess('');
            }}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-1 justify-end ml-auto mr-0"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showChangePassword ? 'rotate-90' : ''}`} />
            <span>{lang === 'ar' ? 'تغيير كلمة المرور الشخصية' : 'Change Security Password'}</span>
          </button>

          {showChangePassword && (
            <form onSubmit={handleUserPasswordChange} className="mt-4 space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/80 animate-fade-in max-w-md mr-auto">
              {pwError && (
                <div className="p-2 bg-rose-50 text-rose-600 text-[10px] rounded-lg border border-rose-100 font-bold text-center">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="p-2 bg-emerald-50 text-emerald-600 text-[10px] rounded-lg border border-emerald-100 font-bold text-center">
                  {pwSuccess}
                </div>
              )}
              <div className="space-y-1 text-right">
                <label className="block text-[10px] text-slate-500 font-bold">
                  {lang === 'ar' ? 'اكتب كلمة المرور الجديدة' : 'New Security Password'}
                </label>
                <input
                  type="text"
                  required
                  value={newPwInput}
                  onChange={e => setNewPwInput(e.target.value)}
                  placeholder={lang === 'ar' ? 'كلمة المرور الجديدة...' : 'New password...'}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-right font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                {lang === 'ar' ? 'حفظ كلمة المرور' : 'Save Password'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Referral Program */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-4 text-right">
          <div className="flex items-center justify-between">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl border border-indigo-100/50">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-indigo-950 text-base">
              {lang === 'ar' ? 'نظام الإحالة والأرباح' : 'Referral Reward System'}
            </h4>
          </div>

          <p className="text-slate-500 text-xs leading-relaxed">
            {t.referralDesc}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Referral code copy widget */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between gap-4">
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1 shrink-0 shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? t.copied : t.copy}</span>
              </button>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">{t.referralCode}</span>
                <span className="font-mono font-black text-indigo-950 text-sm tracking-wider uppercase">{user.referralCode}</span>
              </div>
            </div>

            {/* Referrals success count */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between px-4">
              <span className="text-2xl font-black text-indigo-600">{referralsCount}</span>
              <span className="text-slate-500 text-xs font-bold">{t.referredCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Points Purchase / Payments */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100">
            <CreditCard className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-indigo-950 text-base">
            {t.addPoints}
          </h4>
        </div>

        <p className="text-slate-500 text-xs mt-1 leading-relaxed">
          {t.paymentMethodsTitle}
        </p>

        {/* Dynamic selector list of methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {methods.map(m => {
            const isSelected = paymentMethod === m.name;
            return (
              <button
                key={m.name}
                onClick={() => setPaymentMethod(m.name)}
                className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-center ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500/50 text-emerald-950 shadow-sm ring-1 ring-emerald-500/20'
                    : 'bg-slate-50/60 border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-black text-xs">{lang === 'ar' ? m.ar : m.name}</span>
                <span className="text-[10px] text-slate-400 mt-1">{m.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Support Contact Banner targeting "زر تواصل عندما يريد ابداع المال" */}
        <div className="bg-emerald-50 border border-emerald-100/60 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-right">
          <div className="space-y-1 flex-1">
            <h5 className="font-black text-emerald-900 text-xs flex items-center gap-1.5 justify-end">
              {lang === 'ar' ? 'هل تود إيداع المال وتعبئة رصيدك فوراً؟' : 'Would you like to deposit money and fill your balance instantly?'}
              <HelpCircle className="w-4 h-4 text-emerald-600" />
            </h5>
            <p className="text-[10px] text-emerald-700 leading-relaxed">
              {lang === 'ar' 
                ? 'تواصل معنا مباشرة عبر واتساب أو تليجرام لمساعدتك في تعبئة رصيدك بسرعة وسهولة تامة!' 
                : 'Chat with us directly via WhatsApp or Telegram to assist you in filling your balance quickly and easily!'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
            <a
              href="https://t.me/predatorxi"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>{lang === 'ar' ? 'قناة تلكرام' : 'Telegram Channel'}</span>
            </a>
            <a
              href="https://wa.me/9647502302723"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>{lang === 'ar' ? 'تواصل واتساب' : 'WhatsApp Support'}</span>
            </a>
          </div>
        </div>

        {/* Cash deposit form */}
        <form onSubmit={handleSubmitPayment} className="space-y-4 pt-4 border-t border-slate-100">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl text-center font-bold">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl text-center flex items-center justify-center gap-2 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-600 text-xs font-bold mb-1.5 px-1 text-right">
              {t.amountToPay}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                type="number"
                min="1"
                value={amountCash}
                onChange={e => setAmountCash(parseInt(e.target.value) || 0)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm text-right font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 text-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t.submitPayment}</span>
          </button>
        </form>
      </div>

      {/* Payment Deposit History */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h4 className="font-extrabold text-indigo-950 text-sm mb-4">
          {lang === 'ar' ? 'سجل عمليات الشحن السابقة' : 'Past Deposit Notifications'}
        </h4>

        {pastPayments.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-4">
            {lang === 'ar' ? 'لا يوجد طلبات شحن سابقة.' : 'No deposit requests logged yet.'}
          </div>
        ) : (
          <div className="space-y-3">
            {pastPayments.map(p => (
              <div key={p.id} className="bg-slate-50/55 p-3.5 rounded-2xl border border-slate-100 text-xs flex justify-between items-center gap-4">
                <div>
                  {p.status === 'approved' && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-100">{lang === 'ar' ? 'مقبول' : 'Approved'}</span>
                  )}
                  {p.status === 'rejected' && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px] border border-rose-100">{lang === 'ar' ? 'مرفوض' : 'Rejected'}</span>
                  )}
                  {p.status === 'pending' && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-100 animate-pulse">{lang === 'ar' ? 'قيد المراجعة' : 'Pending Review'}</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-bold text-slate-800">{p.method} • {p.amountCash}$</span>
                  </div>
                  <div className="text-slate-400 text-[10px] font-mono mt-0.5">
                    ID: {p.transactionId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
