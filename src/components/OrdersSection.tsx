import React, { useState, useEffect } from 'react';
import { User, Order } from '../types';
import { StorageEngine } from '../lib/storage';
import { translations, Language } from '../lib/translations';
import { 
  Search, 
  ShoppingBag, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Loader, 
  XCircle, 
  TrendingUp, 
  Gamepad, 
  Copy, 
  Calendar 
} from 'lucide-react';

interface OrdersSectionProps {
  lang: Language;
  user: User;
  refreshTrigger: number;
}

export default function OrdersSection({ lang, user, refreshTrigger }: OrdersSectionProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const t = translations[lang];

  useEffect(() => {
    // Fetch user-specific orders
    const allOrders = StorageEngine.getOrders();
    const userOrders = allOrders.filter(o => o.userId === user.id);
    // Sort by latest first
    userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setOrders(userOrders);
  }, [user.id, refreshTrigger]);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{t.completed}</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 animate-pulse">
            <Loader className="w-3.5 h-3.5 animate-spin" />
            <span>{t.processing}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-600 rounded-full border border-rose-100">
            <XCircle className="w-3.5 h-3.5" />
            <span>{t.cancelled}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-100">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.pending}</span>
          </span>
        );
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(q) ||
      order.serviceNameAr.toLowerCase().includes(q) ||
      order.serviceNameEn.toLowerCase().includes(q) ||
      order.targetLinkOrId.toLowerCase().includes(q) ||
      order.platform.toLowerCase().includes(q)
    );
  });

  const totalSpent = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalCost : 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

  return (
    <div className="space-y-6 pb-24 text-right animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Metrics Banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-100 p-4 rounded-2xl text-center space-y-1 shadow-sm">
          <ShoppingBag className="w-5 h-5 mx-auto text-indigo-600" />
          <p className="text-[10px] text-slate-500 font-bold">{lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</p>
          <p className="text-xl font-black text-indigo-950">{orders.length}</p>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-2xl text-center space-y-1 shadow-sm">
          <TrendingUp className="w-5 h-5 mx-auto text-emerald-600" />
          <p className="text-[10px] text-slate-500 font-bold">{lang === 'ar' ? 'النقاط المصروفة' : 'Spent Points'}</p>
          <p className="text-xl font-black text-indigo-950">{totalSpent}</p>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-2xl text-center space-y-1 shadow-sm">
          <Clock className="w-5 h-5 mx-auto text-amber-500 animate-pulse" />
          <p className="text-[10px] text-slate-500 font-bold">{lang === 'ar' ? 'طلب جاري' : 'Active Orders'}</p>
          <p className="text-xl font-black text-indigo-950">{pendingCount}</p>
        </div>
      </div>

      {/* Header with Search */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-indigo-950 px-1">
          {t.myOrders}
        </h3>
        <div className="relative">
          <span className={`absolute inset-y-0 ${lang === 'ar' ? 'left-3' : 'right-3'} flex items-center text-slate-400`}>
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-sm text-right shadow-sm"
            placeholder={t.searchOrders}
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 space-y-3 shadow-sm">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">{t.noOrders}</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isSMM = order.category === 'smm';
            return (
              <div 
                key={order.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-200/80 hover:shadow-md transition-all text-right space-y-4 relative overflow-hidden shadow-sm"
              >
                {/* Background platform icon */}
                <div className="absolute top-0 left-0 w-24 h-24 text-slate-50/60 -translate-x-4 -translate-y-4 pointer-events-none">
                  {isSMM ? <TrendingUp className="w-full h-full" /> : <Gamepad className="w-full h-full" />}
                </div>

                {/* Top header line */}
                <div className="flex items-start justify-between gap-4 z-10 relative">
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                      {order.platform.toUpperCase()} • {isSMM ? (lang === 'ar' ? 'رشق' : 'SMM') : (lang === 'ar' ? 'شحن' : 'Game')}
                    </span>
                    <h4 className="font-bold text-indigo-950 text-sm md:text-base mt-0.5">
                      {lang === 'ar' ? order.serviceNameAr : order.serviceNameEn}
                    </h4>
                  </div>
                </div>

                {/* Main statistics columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100/80 z-10 relative text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">{lang === 'ar' ? 'رقم العملية' : 'Transaction ID'}</span>
                    <button 
                      onClick={() => handleCopy(order.id)}
                      className="text-slate-700 font-mono hover:text-indigo-600 transition-colors flex items-center gap-1 text-[11px] font-bold"
                    >
                      <span>{copiedId === order.id ? t.copied : order.id}</span>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">{lang === 'ar' ? 'الكمية' : 'Quantity'}</span>
                    <span className="text-slate-800 font-bold font-mono">{order.quantity.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">{lang === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}</span>
                    <span className="text-emerald-600 font-black font-mono">{order.totalCost} {t.points}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">{lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</span>
                    <span className="text-slate-500 font-mono text-[10px] flex items-center justify-end gap-1">
                      {new Date(order.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                      <Calendar className="w-3 h-3 text-slate-400" />
                    </span>
                  </div>
                </div>

                {/* Link or Player ID target row */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs flex items-center justify-between gap-4">
                  {isSMM ? (
                    <a 
                      href={order.targetLinkOrId} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 font-mono text-[11px] truncate max-w-[70%] font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="truncate">{order.targetLinkOrId}</span>
                    </a>
                  ) : (
                    <span className="text-indigo-950 font-black font-mono text-sm">
                      {order.targetLinkOrId}
                    </span>
                  )}
                  <span className="text-slate-500 font-bold shrink-0">
                    {isSMM ? (lang === 'ar' ? 'الحساب المستهدف' : 'Target URL') : (lang === 'ar' ? 'معرف اللاعب ID' : 'Player ID')}
                  </span>
                </div>

                {/* Extra details if available (e.g. Game Nickname) */}
                {order.extraDetails && (
                  <div className="flex items-center justify-between text-xs px-2.5 pt-1">
                    <span className="text-slate-700 font-mono font-bold">{order.extraDetails}</span>
                    <span className="text-slate-400 font-medium">{lang === 'ar' ? 'الاسم المستعار باللعبة' : 'Character Nickname'}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
