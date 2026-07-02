import React, { useState, useEffect } from 'react';
import { User, Service, Order } from '../types';
import { StorageEngine } from '../lib/storage';
import { translations, Language } from '../lib/translations';
import { 
  Instagram, 
  Facebook, 
  Youtube, 
  Send, 
  Twitter, 
  Gamepad2, 
  Search, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  ArrowRightLeft, 
  TrendingUp, 
  Award, 
  Clock, 
  Layers,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface HomeSectionProps {
  lang: Language;
  user: User;
  onOrderPlaced: () => void;
}

export default function HomeSection({ lang, user, onOrderPlaced }: HomeSectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ordering state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [quantity, setQuantity] = useState<number>(1000);
  const [targetLinkOrId, setTargetLinkOrId] = useState('');
  const [extraDetails, setExtraDetails] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const t = translations[lang];

  useEffect(() => {
    // Load services from Storage
    setServices(StorageEngine.getServices());
  }, []);

  // Filter lists
  const platformsSmm = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All', icon: Layers },
    { id: 'facebook', labelAr: 'فيسبوك', labelEn: 'Facebook', icon: Facebook },
    { id: 'tiktok', labelAr: 'تيك توك', labelEn: 'TikTok', icon: TrendingUp },
    { id: 'instagram', labelAr: 'انستغرام', labelEn: 'Instagram', icon: Instagram },
    { id: 'telegram', labelAr: 'تليجرام', labelEn: 'Telegram', icon: Send },
    { id: 'twitter', labelAr: 'تويتر (X)', labelEn: 'Twitter (X)', icon: Twitter },
    { id: 'youtube', labelAr: 'يوتيوب', labelEn: 'YouTube', icon: Youtube },
  ];

  const platformsGames = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All', icon: Layers },
    { id: 'pubg', labelAr: 'ببجي موبايل', labelEn: 'PUBG Mobile', icon: Gamepad2 },
    { id: 'yalla_ludo', labelAr: 'يلا لودو', labelEn: 'Yalla Ludo', icon: TrophyIcon },
    { id: 'other_games', labelAr: 'ألعاب أخرى', labelEn: 'Other Games', icon: Gamepad2 },
  ];

  // Dynamic platforms builder
  const getPlatformsForCategory = () => {
    let baseList = selectedCategory === 'games' 
      ? platformsGames 
      : (selectedCategory === 'smm' 
          ? platformsSmm 
          : [{ id: 'all', labelAr: 'الكل', labelEn: 'All', icon: Layers }]);
    
    const activeServices = services.filter(s => selectedCategory === 'all' || s.category === selectedCategory);
    const customPlatforms = activeServices
      .map(s => s.platform)
      .filter(p => !baseList.some(item => item.id === p));
    
    const uniqueCustom = Array.from(new Set(customPlatforms)) as string[];
    const fullList = [...baseList];
    uniqueCustom.forEach(plat => {
      fullList.push({
        id: plat,
        labelAr: plat,
        labelEn: plat,
        icon: Sparkles
      });
    });
    
    return fullList;
  };

  // Dynamic categories list
  const uniqueCategories = Array.from(new Set(services.map(s => s.category))) as string[];
  const categoriesList = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All', icon: Layers },
    { id: 'smm', labelAr: 'رشق ومتابعين', labelEn: 'SMM Services', icon: TrendingUp },
    { id: 'games', labelAr: 'شحن ألعاب', labelEn: 'Game Charging', icon: Gamepad2 },
  ];
  
  uniqueCategories.forEach(cat => {
    if (cat !== 'smm' && cat !== 'games' && cat) {
      categoriesList.push({
        id: cat,
        labelAr: cat === 'custom' ? (lang === 'ar' ? 'مخصص' : 'Custom') : cat,
        labelEn: cat === 'custom' ? 'Custom' : cat,
        icon: Sparkles
      });
    }
  });

  function TrophyIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
        <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
      </svg>
    );
  }

  // Handle Category Change
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedPlatform('all');
    setSelectedService(null);
  };

  // Filter Services
  const filteredServices = services.filter(service => {
    // 1. Category check
    if (selectedCategory !== 'all' && service.category !== selectedCategory) {
      return false;
    }
    // 2. Platform check
    if (selectedPlatform !== 'all' && service.platform !== selectedPlatform) {
      return false;
    }
    // 3. Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAr = service.nameAr.toLowerCase().includes(q) || service.descriptionAr.toLowerCase().includes(q);
      const matchEn = service.nameEn.toLowerCase().includes(q) || service.descriptionEn.toLowerCase().includes(q);
      const matchPlatform = service.platform.toLowerCase().includes(q);
      return matchAr || matchEn || matchPlatform;
    }
    return true;
  });

  // Calculate order price live
  const calculateCost = (service: Service, qty: number) => {
    if (service.category === 'smm') {
      const pricePer1000 = service.pricePer1000 || 0;
      return Math.round((qty / 1000) * pricePer1000);
    } else {
      return service.fixedPrice || 0;
    }
  };

  // Pre-fill quantity when service changes
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setError('');
    setSuccess('');
    if (service.category === 'smm') {
      setQuantity(service.minOrder || 1000);
    } else {
      setQuantity(1);
    }
    setTargetLinkOrId('');
    setExtraDetails('');
  };

  // Submit Order
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedService) return;

    if (!targetLinkOrId.trim()) {
      setError(t.requiredLinkOrId);
      return;
    }

    // Validation quantity
    if (selectedService.category === 'smm') {
      const min = selectedService.minOrder || 100;
      const max = selectedService.maxOrder || 10000;
      if (quantity < min || quantity > max) {
        setError(t.invalidQuantity);
        return;
      }
    }

    const cost = calculateCost(selectedService, quantity);

    // Points balance check
    const users = StorageEngine.getUsers();
    const currentUserIndex = users.findIndex(u => u.id === user.id);
    if (currentUserIndex === -1) return;

    if (users[currentUserIndex].points < cost) {
      setError(t.notEnoughPoints);
      return;
    }

    // Deduct points
    users[currentUserIndex].points -= cost;
    StorageEngine.saveUsers(users);

    // Push new order
    const orders = StorageEngine.getOrders();
    const newOrder: Order = {
      id: 'ord-' + Math.floor(100000 + Math.random() * 900000),
      userId: user.id,
      userEmail: user.email,
      serviceId: selectedService.id,
      serviceNameAr: selectedService.nameAr,
      serviceNameEn: selectedService.nameEn,
      platform: selectedService.platform,
      category: selectedService.category,
      quantity: selectedService.category === 'smm' ? quantity : (selectedService.packageSize || 1),
      targetLinkOrId: targetLinkOrId,
      extraDetails: extraDetails,
      totalCost: cost,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    StorageEngine.saveOrders(orders);

    setSuccess(t.orderSuccess);
    setSelectedService(null);
    onOrderPlaced(); // notify parent to refresh user info & orders list
  };

  return (
    <div className="space-y-6 pb-24 text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Banner Intro */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 to-indigo-950 p-6 md:p-8 border border-indigo-200/20 shadow-lg shadow-indigo-100/40 text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-white/10 text-emerald-300 rounded-full border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'خصم خاص 15% على شحن ألعاب هذا الأسبوع!' : 'Special 15% discount on Games Top-up this week!'}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              {lang === 'ar' ? 'اختر خدمتك وابدأ الانتشار فوراً' : 'Boost Your Social Traffic and Top-Up Seamlessly'}
            </h2>
            <p className="text-indigo-100 text-xs md:text-sm">
              {lang === 'ar' 
                ? 'استمتع بأقوى نظام رشق آلي سريع وموثوق لدعم حسابات فيسبوك، تيك توك، انستغرام، يوتيوب وألعابك المفضلة كببجي ويلا لودو.' 
                : 'Premium SMM provider and top-up portal for Instagram, TikTok, Facebook, PUBG and more.'}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center flex-shrink-0 min-w-[140px] shadow-inner">
            <p className="text-indigo-200 text-[10px] uppercase font-bold tracking-wider mb-1">
              {t.userPoints}
            </p>
            <p className="text-2xl font-black text-emerald-300">
              {user.points.toLocaleString()}
            </p>
            <p className="text-indigo-200 text-[10px] mt-1">
              {lang === 'ar' ? 'نقاط جاهزة' : 'Points Active'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Categories Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {categoriesList.map(cat => {
          const IconComp = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`py-3 px-2 text-xs md:text-sm font-bold rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/15'
                  : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
              }`}
            >
              <IconComp className="w-5 h-5" />
              <span>{lang === 'ar' ? cat.labelAr : cat.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Platform Filters */}
      <div className="space-y-4">
        <div className="relative">
          <span className={`absolute inset-y-0 ${lang === 'ar' ? 'left-3' : 'right-3'} flex items-center text-slate-400`}>
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-right shadow-sm"
            placeholder={t.searchService}
          />
        </div>

        {/* Dynamic Horizontal scroll of platforms/games */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
          {getPlatformsForCategory().map(p => {
            const IconComp = p.icon;
            const isSelected = selectedPlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { setSelectedPlatform(p.id); setSelectedService(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full border flex-shrink-0 transition-all ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? p.labelAr : p.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services List / Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-indigo-950 px-1">
          {lang === 'ar' ? 'الخدمات المتاحة للتنفيذ الآلي' : 'Available Automated Services'} ({filteredServices.length})
        </h3>

        {filteredServices.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-sm">
            {lang === 'ar' ? 'لم يتم العثور على أي خدمات تطابق شروط البحث!' : 'No services match the search filter.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map(service => {
              const isSelected = selectedService?.id === service.id;
              const isSMM = service.category === 'smm';
              return (
                <div
                  key={service.id}
                  className={`border rounded-2xl p-5 transition-all text-right relative overflow-hidden flex flex-col justify-between bg-white shadow-sm ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/15'
                      : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                  }`}
                >
                  {/* Category Badge & Top indicators */}
                  <div className="flex justify-between items-start gap-4 mb-2.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200/60">
                      {service.platform.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {isSMM 
                        ? `${service.pricePer1000} ${t.points} / 1000` 
                        : `${service.fixedPrice} ${t.points}`
                      }
                    </span>
                  </div>

                  {/* Service Text details */}
                  <div className="space-y-1 mb-4">
                    <h4 className="font-bold text-slate-900 text-sm md:text-base">
                      {lang === 'ar' ? service.nameAr : service.nameEn}
                    </h4>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {lang === 'ar' ? service.descriptionAr : service.descriptionEn}
                    </p>
                  </div>

                  {/* SMM limits indicators */}
                  {isSMM && (
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 mb-4 border-t border-slate-100 pt-2.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {t.minOrder}: {service.minOrder}
                      </span>
                      <span className="font-medium">
                        {t.maxOrder}: {service.maxOrder}
                      </span>
                    </div>
                  )}

                  {/* Choose Service button */}
                  <button
                    onClick={() => handleServiceSelect(service)}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50'
                    }`}
                  >
                    {isSelected 
                      ? (lang === 'ar' ? 'الخدمة محددة حالياً' : 'Service Selected') 
                      : (lang === 'ar' ? 'طلب هذه الخدمة' : 'Request This Service')
                    }
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Order Form Modal / Card when Selected */}
      {selectedService && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 overflow-y-auto p-4 flex justify-center items-start">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in my-auto md:my-8" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <button 
                onClick={() => setSelectedService(null)}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 transition-all text-xs font-bold"
              >
                {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{lang === 'ar' ? 'رجوع' : 'Back'}</span>
              </button>
              <h3 className="text-base font-extrabold text-indigo-950">
                {lang === 'ar' ? 'تأكيد الطلب السريع' : 'Quick Order Confirmation'}
              </h3>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePlaceOrder} className="p-6 space-y-4 text-right">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl text-center flex items-center justify-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Service Details Static */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-right space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50">
                  {selectedService.platform.toUpperCase()}
                </span>
                <h4 className="font-bold text-slate-900 text-sm pt-1">
                  {lang === 'ar' ? selectedService.nameAr : selectedService.nameEn}
                </h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {lang === 'ar' ? selectedService.descriptionAr : selectedService.descriptionEn}
                </p>
              </div>

              {/* Input for Target Target Link or Player ID */}
              <div>
                <label className="block text-slate-600 text-xs font-bold mb-1.5 px-1 text-right">
                  {selectedService.category === 'smm' ? t.targetLinkSmm : t.targetIdGame}
                </label>
                <input
                  type="text"
                  required
                  value={targetLinkOrId}
                  onChange={e => setTargetLinkOrId(e.target.value)}
                  className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-right font-mono"
                  placeholder={selectedService.category === 'smm' ? 'https://instagram.com/...' : '1234567890'}
                />
              </div>

              {/* Extra input for game names or region if any */}
              {selectedService.category === 'games' && (
                <div>
                  <label className="block text-slate-600 text-xs font-bold mb-1.5 px-1 text-right">
                    {t.extraDetailsGame}
                  </label>
                  <input
                    type="text"
                    value={extraDetails}
                    onChange={e => setExtraDetails(e.target.value)}
                    className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-right"
                    placeholder="e.g. AL-NUAIMI"
                  />
                </div>
              )}

              {/* Quantity Selector for SMM */}
              {selectedService.category === 'smm' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5 px-1">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {t.minOrder}: {selectedService.minOrder} / {t.maxOrder}: {selectedService.maxOrder}
                    </span>
                    <label className="block text-slate-600 text-xs font-bold text-right">
                      {t.quantity}
                    </label>
                  </div>
                  <input
                    type="number"
                    value={quantity}
                    min={selectedService.minOrder}
                    max={selectedService.maxOrder}
                    onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-right font-mono"
                  />
                </div>
              )}

              {/* Order points counter card */}
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between text-right">
                <div className="text-right">
                  <p className="text-slate-500 text-[10px] font-bold">{lang === 'ar' ? 'رصيدك الحالي' : 'Your Balance'}</p>
                  <p className="text-sm font-bold text-slate-700">{user.points} {t.points}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-700 text-xs font-bold">{t.calculatedCost}</p>
                  <p className="text-2xl font-black text-indigo-950">
                    {calculateCost(selectedService, quantity)} <span className="text-xs text-emerald-600">{t.points}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-500/15 flex items-center justify-center gap-2"
              >
                <span>{t.submitOrder}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
