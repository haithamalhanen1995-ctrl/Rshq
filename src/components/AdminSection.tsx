import React, { useState, useEffect } from 'react';
import { User, Service, Order, PaymentRequest } from '../types';
import { StorageEngine } from '../lib/storage';
import { translations, Language } from '../lib/translations';
import { 
  Shield, 
  Settings, 
  ShoppingBag, 
  UserPlus, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  Gamepad2, 
  Award, 
  ChevronDown, 
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

interface AdminSectionProps {
  lang: Language;
  onRefreshParent: () => void;
  refreshTrigger?: number;
}

export default function AdminSection({ lang, onRefreshParent, refreshTrigger }: AdminSectionProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'users' | 'payments'>('orders');
  
  // Database States
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentRequest[]>([]);

  // Editing Service States
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState<Partial<Service>>({
    category: 'smm',
    platform: 'instagram',
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    pricePer1000: 100,
    fixedPrice: 100,
    packageSize: 1000,
    minOrder: 100,
    maxOrder: 10000
  });

  // Adding Points States
  const [pointsInputUserId, setPointsInputUserId] = useState<string | null>(null);
  const [addPointsAmount, setAddPointsAmount] = useState<number>(500);

  // Custom Category and Platform inputs
  const [customCategory, setCustomCategory] = useState('');
  const [customPlatform, setCustomPlatform] = useState('');

  // Password editing state for users
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const t = translations[lang];

  // Initial load: fetch the latest data directly from Firestore
  useEffect(() => {
    const fetchLatest = async () => {
      setIsRefreshing(true);
      await StorageEngine.forceFetchAllFromFirestore();
      loadAllData();
      setIsRefreshing(false);
    };
    fetchLatest();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [refreshTrigger]);

  const loadAllData = () => {
    setAllOrders(StorageEngine.getOrders());
    setAllServices(StorageEngine.getServices());
    setAllUsers(StorageEngine.getUsers());
    setAllPayments(StorageEngine.getPaymentRequests());
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await StorageEngine.forceFetchAllFromFirestore();
    loadAllData();
    setIsRefreshing(false);
    onRefreshParent();
  };

  // Change order status SMM or game
  const handleOrderStatusChange = (orderId: string, newStatus: Order['status']) => {
    const orders = StorageEngine.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].status = newStatus;
      StorageEngine.saveOrders(orders);
      setAllOrders(orders);
      onRefreshParent();
    }
  };

  // Manage Payment Deposits Approve or Reject
  const handlePaymentStatusChange = (paymentId: string, status: 'approved' | 'rejected') => {
    const payments = StorageEngine.getPaymentRequests();
    const users = StorageEngine.getUsers();
    
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    if (paymentIndex === -1) return;

    if (payments[paymentIndex].status !== 'pending') return; // already processed

    payments[paymentIndex].status = status;
    StorageEngine.savePaymentRequests(payments);

    // If approved, add points to the target user
    if (status === 'approved') {
      const targetUserId = payments[paymentIndex].userId;
      const userIndex = users.findIndex(u => u.id === targetUserId);
      if (userIndex !== -1) {
        users[userIndex].points += payments[paymentIndex].amountPoints;
        StorageEngine.saveUsers(users);
      }
    }

    loadAllData();
    onRefreshParent();
  };

  // Delete Service
  const handleDeleteService = (serviceId: string) => {
    if (window.confirm(t.deleteConfirm)) {
      StorageEngine.deleteService(serviceId);
      loadAllData();
    }
  };

  // Save / Add / Edit Service Form submit
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const services = StorageEngine.getServices();

    const finalCategory = serviceForm.category === 'custom' ? customCategory.trim() : (serviceForm.category || 'smm');
    const finalPlatform = serviceForm.platform === 'custom' ? customPlatform.trim() : (serviceForm.platform || 'instagram');

    if (editingService) {
      // Edit
      const updated = services.map(s => {
        if (s.id === editingService.id) {
          return {
            ...s,
            ...serviceForm,
            category: finalCategory,
            platform: finalPlatform,
            pricePer1000: finalCategory === 'smm' ? (serviceForm.pricePer1000 || 100) : undefined,
            fixedPrice: finalCategory !== 'smm' ? (serviceForm.fixedPrice || 100) : undefined,
            packageSize: serviceForm.packageSize || 1000,
            minOrder: finalCategory === 'smm' ? (serviceForm.minOrder || 100) : undefined,
            maxOrder: finalCategory === 'smm' ? (serviceForm.maxOrder || 10000) : undefined
          } as Service;
        }
        return s;
      });
      StorageEngine.saveServices(updated);
    } else {
      // Create new
      const newService: Service = {
        id: 'service-' + Date.now(),
        category: finalCategory,
        platform: finalPlatform,
        nameAr: serviceForm.nameAr || 'اسم خدمة جديدة',
        nameEn: serviceForm.nameEn || 'New Service Name',
        descriptionAr: serviceForm.descriptionAr || '',
        descriptionEn: serviceForm.descriptionEn || '',
        pricePer1000: finalCategory === 'smm' ? (serviceForm.pricePer1000 || 100) : undefined,
        fixedPrice: finalCategory !== 'smm' ? (serviceForm.fixedPrice || 100) : undefined,
        packageSize: serviceForm.packageSize || 1000,
        minOrder: finalCategory === 'smm' ? (serviceForm.minOrder || 100) : undefined,
        maxOrder: finalCategory === 'smm' ? (serviceForm.maxOrder || 10000) : undefined
      };
      services.push(newService);
      StorageEngine.saveServices(services);
    }

    setShowServiceForm(false);
    setEditingService(null);
    setCustomCategory('');
    setCustomPlatform('');
    loadAllData();
  };

  // Open Edit service modal
  const handleOpenEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm(service);

    const isStandardCategory = ['smm', 'games'].includes(service.category);
    if (!isStandardCategory) {
      setCustomCategory(service.category);
      setServiceForm(prev => ({ ...prev, category: 'custom' }));
    } else {
      setCustomCategory('');
    }

    const isStandardPlatform = ['facebook', 'tiktok', 'instagram', 'telegram', 'twitter', 'youtube', 'pubg', 'yalla_ludo', 'other_games'].includes(service.platform);
    if (!isStandardPlatform) {
      setCustomPlatform(service.platform);
      setServiceForm(prev => ({ ...prev, platform: 'custom' }));
    } else {
      setCustomPlatform('');
    }

    setShowServiceForm(true);
  };

  // Add Points Manually for users
  const handleAddPointsManual = (userId: string) => {
    const users = StorageEngine.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].points += addPointsAmount;
      StorageEngine.saveUsers(users);
      setPointsInputUserId(null);
      loadAllData();
      onRefreshParent();
    }
  };

  // Change user role admin/user
  const handleToggleUserRole = (userId: string, currentRole: User['role']) => {
    const users = StorageEngine.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].role = currentRole === 'admin' ? 'user' : 'admin';
      StorageEngine.saveUsers(users);
      loadAllData();
    }
  };

  // Change user password by Admin
  const handleChangeUserPassword = (userId: string) => {
    if (!newPasswordValue.trim()) return;
    const users = StorageEngine.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].password = newPasswordValue.trim();
      StorageEngine.saveUsers(users);
      
      // Update session if it is current user
      const currentSession = StorageEngine.getSessionUser();
      if (currentSession && currentSession.id === userId) {
        currentSession.password = newPasswordValue.trim();
        StorageEngine.setSessionUser(currentSession);
      }

      setEditingPasswordUserId(null);
      setNewPasswordValue('');
      loadAllData();
      onRefreshParent();
    }
  };

  // Delete user from Database by Admin
  const handleDeleteUser = (userId: string) => {
    const session = StorageEngine.getSessionUser();
    if (session && session.id === userId) {
      return; // Safe guard
    }
    StorageEngine.deleteUser(userId);
    setConfirmDeleteUserId(null);
    loadAllData();
    onRefreshParent();
  };

  // Calculations for stats
  const totalSpentPoints = allOrders.reduce((acc, o) => acc + o.totalCost, 0);
  const pendingPaymentsCount = allPayments.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6 pb-24 text-right animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Admin Panel Welcome */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-rose-600 bg-rose-50 px-3 py-1 rounded-full font-bold border border-rose-100 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'لوحة المسؤول الشاملة' : 'Full Administrator Mode'}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`text-xs px-3 py-1 rounded-full font-bold border flex items-center gap-1.5 transition-all ${
              isRefreshing 
                ? 'bg-amber-50 text-amber-600 border-amber-200 cursor-not-allowed animate-pulse' 
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? (lang === 'ar' ? 'جاري التحديث...' : 'Refreshing...') : (lang === 'ar' ? 'تحديث البيانات' : 'تحديث البيانات')}</span>
          </button>
        </div>
        <h2 className="text-xl font-black text-indigo-950">
          {t.adminDashboard}
        </h2>
      </div>

      {/* Admin Quick Statistics Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-100 p-4 rounded-2xl text-center shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold">{t.statTotalOrders}</p>
          <p className="text-xl font-black text-indigo-950 mt-1">{allOrders.length}</p>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-2xl text-center shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold">{t.statTotalUsers}</p>
          <p className="text-xl font-black text-indigo-950 mt-1">{allUsers.length}</p>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-2xl text-center shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold">{t.statTotalPoints}</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{totalSpentPoints}</p>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-2xl text-center shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold">{t.statPendingPayments}</p>
          <p className="text-xl font-black text-rose-600 mt-1">{pendingPaymentsCount}</p>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200/50 overflow-x-auto scrollbar-none gap-1 shadow-inner">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-950'
          }`}
        >
          {t.manageOrders}
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'services' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-950'
          }`}
        >
          {t.manageServices}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-950'
          }`}
        >
          {t.manageUsers}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap relative ${
            activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-950'
          }`}
        >
          <span>{t.managePayments}</span>
          {pendingPaymentsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
          )}
        </button>
      </div>

      {/* TAB CONTENT: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-indigo-950 px-1">{t.manageOrders}</h3>

          {allOrders.length === 0 ? (
            <div className="text-center text-slate-400 py-6 text-xs">{lang === 'ar' ? 'لا يوجد طلبات حالياً.' : 'No orders stored yet.'}</div>
          ) : (
            allOrders.map(order => (
              <div key={order.id} className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3 text-right shadow-sm">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOrderStatusChange(order.id, 'completed')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold transition-all border border-emerald-100"
                    >
                      {lang === 'ar' ? 'مكتمل' : 'Complete'}
                    </button>
                    <button
                      onClick={() => handleOrderStatusChange(order.id, 'processing')}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-all border border-indigo-100"
                    >
                      {lang === 'ar' ? 'جاري التنفيذ' : 'Process'}
                    </button>
                    <button
                      onClick={() => handleOrderStatusChange(order.id, 'cancelled')}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition-all border border-rose-100"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{order.id} • {order.userEmail}</span>
                    <h4 className="font-extrabold text-indigo-950 text-sm mt-0.5">{lang === 'ar' ? order.serviceNameAr : order.serviceNameEn}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block font-bold">{lang === 'ar' ? 'الكمية' : 'Qty'}</span>
                    <span className="text-slate-800 font-bold">{order.quantity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">{lang === 'ar' ? 'التكلفة' : 'Cost'}</span>
                    <span className="text-emerald-700 font-bold">{order.totalCost}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">{lang === 'ar' ? 'الحالة' : 'Status'}</span>
                    <span className="text-amber-700 font-bold">{order.status}</span>
                  </div>
                </div>

                <div className="text-[11px] bg-slate-50 p-2 rounded border border-slate-100 text-left font-mono break-all text-slate-600">
                  <span className="text-slate-400 text-right block font-bold">{lang === 'ar' ? 'الحساب المستهدف / المعرف' : 'Target link or Player ID'}</span>
                  {order.targetLinkOrId}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: SERVICES CRUD */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setEditingService(null);
                setServiceForm({
                  category: 'smm',
                  platform: 'instagram',
                  nameAr: '',
                  nameEn: '',
                  descriptionAr: '',
                  descriptionEn: '',
                  pricePer1000: 100,
                  fixedPrice: 100,
                  packageSize: 1000,
                  minOrder: 100,
                  maxOrder: 10000
                });
                setCustomCategory('');
                setCustomPlatform('');
                setShowServiceForm(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addService}</span>
            </button>
            <h3 className="text-sm font-bold text-indigo-950 px-1">{t.manageServices}</h3>
          </div>

          {/* New/Edit Service Form Modal */}
          {showServiceForm && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-lg overflow-y-auto max-h-[90vh] shadow-2xl animate-fade-in">
                <div className="p-6 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <button onClick={() => setShowServiceForm(false)} className="text-slate-500 text-xs font-bold hover:text-slate-800">{t.cancel}</button>
                  <h4 className="font-extrabold text-indigo-950 text-base">
                    {editingService ? t.editService : t.addService}
                  </h4>
                </div>

                <form onSubmit={handleSaveService} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Category */}
                    <div>
                      <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{t.serviceCategory}</label>
                      <select
                        value={serviceForm.category}
                        onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="smm">SMM (رشق ومتابعين)</option>
                        <option value="games">Games (شحن ألعاب)</option>
                        <option value="custom">{lang === 'ar' ? 'مخصص / تصنيف جديد...' : 'Custom / New Category...'}</option>
                      </select>
                    </div>

                    {/* Platform */}
                    <div>
                      <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{t.servicePlatform}</label>
                      <select
                        value={serviceForm.platform}
                        onChange={e => setServiceForm({ ...serviceForm, platform: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                        <option value="instagram">Instagram</option>
                        <option value="telegram">Telegram</option>
                        <option value="twitter">Twitter/X</option>
                        <option value="youtube">YouTube</option>
                        <option value="pubg">PUBG Mobile</option>
                        <option value="yalla_ludo">Yalla Ludo</option>
                        <option value="other_games">Other Games</option>
                        <option value="custom">{lang === 'ar' ? 'مخصص / منصة جديدة...' : 'Custom / New Platform...'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditionally Render Custom Category Textbox */}
                  {serviceForm.category === 'custom' && (
                    <div className="animate-fade-in">
                      <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{lang === 'ar' ? 'اسم التصنيف المخصص (مثال: حسابات مميزة)' : 'Custom Category Name (e.g. Premium Accounts)'}</label>
                      <input
                        type="text"
                        required
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Premium Accounts..."
                      />
                    </div>
                  )}

                  {/* Conditionally Render Custom Platform Textbox */}
                  {serviceForm.platform === 'custom' && (
                    <div className="animate-fade-in">
                      <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{lang === 'ar' ? 'اسم المنصة المخصصة (مثال: Snapchat)' : 'Custom Platform Name (e.g. Snapchat)'}</label>
                      <input
                        type="text"
                        required
                        value={customPlatform}
                        onChange={e => setCustomPlatform(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Snapchat..."
                      />
                    </div>
                  )}

                  {/* Name Ar */}
                  <div>
                    <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{t.nameArLabel}</label>
                    <input
                      type="text"
                      required
                      value={serviceForm.nameAr}
                      onChange={e => setServiceForm({ ...serviceForm, nameAr: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Name En */}
                  <div>
                    <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{t.nameEnLabel}</label>
                    <input
                      type="text"
                      required
                      value={serviceForm.nameEn}
                      onChange={e => setServiceForm({ ...serviceForm, nameEn: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Description Ar */}
                  <div>
                    <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{t.descArLabel}</label>
                    <textarea
                      value={serviceForm.descriptionAr}
                      onChange={e => setServiceForm({ ...serviceForm, descriptionAr: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs text-right h-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Description En */}
                  <div>
                    <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{t.descEnLabel}</label>
                    <textarea
                      value={serviceForm.descriptionEn}
                      onChange={e => setServiceForm({ ...serviceForm, descriptionEn: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs text-left h-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {serviceForm.category === 'smm' ? (
                      <>
                        {/* Price per 1000 SMM */}
                        <div>
                          <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{t.pricePer1000Label}</label>
                          <input
                            type="number"
                            value={serviceForm.pricePer1000}
                            onChange={e => setServiceForm({ ...serviceForm, pricePer1000: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        {/* Package Size placeholder */}
                        <div>
                          <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{t.packageSizeLabel}</label>
                          <input
                            type="number"
                            value={serviceForm.packageSize}
                            onChange={e => setServiceForm({ ...serviceForm, packageSize: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </>
                    ) : (
                      /* Fixed Price Games */
                      <div className="col-span-2">
                        <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{t.fixedPriceLabel}</label>
                        <input
                          type="number"
                          value={serviceForm.fixedPrice}
                          onChange={e => setServiceForm({ ...serviceForm, fixedPrice: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    )}
                  </div>

                  {serviceForm.category === 'smm' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{t.minOrderLabel}</label>
                        <input
                          type="number"
                          value={serviceForm.minOrder}
                          onChange={e => setServiceForm({ ...serviceForm, minOrder: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-xs font-bold mb-1 text-right">{t.maxOrderLabel}</label>
                        <input
                          type="number"
                          value={serviceForm.maxOrder}
                          onChange={e => setServiceForm({ ...serviceForm, maxOrder: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-500/10"
                  >
                    {t.save}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* List of current services */}
          <div className="space-y-2">
            {allServices.map(service => (
              <div key={service.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between text-right gap-4 shadow-sm">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditService(service)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 rounded-lg border border-slate-200/60 transition-all shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 transition-all shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-right flex-1">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200/40 text-slate-500">
                      {service.platform}
                    </span>
                    <h5 className="font-extrabold text-indigo-950 text-xs">{lang === 'ar' ? service.nameAr : service.nameEn}</h5>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{lang === 'ar' ? service.descriptionAr : service.descriptionEn}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-indigo-950 px-1">{t.manageUsers}</h3>

          <div className="space-y-3">
            {allUsers.map(userItem => (
              <div key={userItem.id} className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3 text-right shadow-sm">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setPointsInputUserId(pointsInputUserId === userItem.id ? null : userItem.id)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold transition-all border border-emerald-100 shadow-sm"
                    >
                      {lang === 'ar' ? 'تعديل الرصيد' : 'Edit Balance'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPasswordUserId(editingPasswordUserId === userItem.id ? null : userItem.id);
                        setNewPasswordValue('');
                      }}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold transition-all border border-amber-100 shadow-sm"
                    >
                      {lang === 'ar' ? 'تغيير الرمز' : 'Change Code'}
                    </button>
                    <button
                      onClick={() => handleToggleUserRole(userItem.id, userItem.role)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-all border border-indigo-100 shadow-sm"
                    >
                      {userItem.role === 'admin' ? (lang === 'ar' ? 'تنزيل لمستخدم' : 'Demote') : (lang === 'ar' ? 'ترقية لمشرف' : 'Promote')}
                    </button>
                    {StorageEngine.getSessionUser()?.id !== userItem.id && (
                      <>
                        {confirmDeleteUserId === userItem.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-lg border border-rose-100 animate-pulse text-[10px] font-black">
                            <span>{lang === 'ar' ? 'تأكيد؟' : 'Confirm?'}</span>
                            <button
                              onClick={() => handleDeleteUser(userItem.id)}
                              className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-black"
                            >
                              {lang === 'ar' ? 'نعم' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteUserId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-bold"
                            >
                              {lang === 'ar' ? 'لا' : 'No'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteUserId(userItem.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition-all border border-rose-100 shadow-sm flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{lang === 'ar' ? 'حذف العضو' : 'Delete'}</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      userItem.role === 'admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-500 border border-slate-200/40'
                    }`}>
                      {userItem.role === 'admin' ? (lang === 'ar' ? 'مشرف رئيسي' : 'Admin') : (lang === 'ar' ? 'عضو' : 'User')}
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">ID: {userItem.id} • {t.referralCode}: {userItem.referralCode}</p>
                  </div>
                </div>

                {/* Email and Password Info row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">
                    <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'كلمة المرور للرقم' : 'Password / Security Code'}</span>
                    <span className="text-xs text-slate-800 font-mono font-black select-all">{userItem.password || 'admin'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">
                    <span className="text-[10px] text-slate-400 block font-bold">{lang === 'ar' ? 'البريد الإلكتروني للعضو' : 'Registered Email Address'}</span>
                    <span className="text-xs text-slate-800 font-bold select-all">{userItem.email}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-indigo-50/45 p-2.5 rounded-xl border border-indigo-100/40 text-xs px-4">
                  <span className="text-indigo-700 font-extrabold">{userItem.points.toLocaleString()} {t.points}</span>
                  <span className="text-slate-500 font-bold">{t.userPointsCol}</span>
                </div>

                {/* Inline Points adjustments */}
                {pointsInputUserId === userItem.id && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleAddPointsManual(userItem.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-sm shrink-0"
                    >
                      {lang === 'ar' ? 'إضافة رصيد' : 'Apply'}
                    </button>
                    <input
                      type="number"
                      value={addPointsAmount}
                      onChange={e => setAddPointsAmount(parseInt(e.target.value) || 0)}
                      className="bg-white border border-slate-200 rounded-lg text-slate-800 text-xs px-2 py-1.5 text-right flex-1 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-slate-500 text-[10px] shrink-0 font-bold">{lang === 'ar' ? 'القيمة بالنقاط' : 'Points Amount'}</span>
                  </div>
                )}

                {/* Inline Password adjustments */}
                {editingPasswordUserId === userItem.id && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleChangeUserPassword(userItem.id)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shadow-sm shrink-0"
                    >
                      {lang === 'ar' ? 'تحديث الرمز' : 'Update'}
                    </button>
                    <input
                      type="text"
                      required
                      value={newPasswordValue}
                      onChange={e => setNewPasswordValue(e.target.value)}
                      placeholder={lang === 'ar' ? 'اكتب كلمة المرور الجديدة' : 'New password...'}
                      className="bg-white border border-slate-200 rounded-lg text-slate-800 text-xs px-2 py-1.5 text-right flex-1 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-slate-500 text-[10px] shrink-0 font-bold">{lang === 'ar' ? 'الرمز الجديد' : 'New Code'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DEPOSIT NOTIFICATIONS APPROVALS */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-indigo-950 px-1">{t.managePayments}</h3>

          {allPayments.length === 0 ? (
            <div className="text-center text-slate-400 py-6 text-xs">{lang === 'ar' ? 'لا توجد طلبات شحن مضافة.' : 'No deposit logs.'}</div>
          ) : (
            allPayments.map(pay => (
              <div key={pay.id} className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4 text-right shadow-sm animate-fade-in">
                <div className="flex justify-between items-center gap-4">
                  {pay.status === 'pending' ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handlePaymentStatusChange(pay.id, 'approved')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>{t.approve}</span>
                      </button>
                      <button
                        onClick={() => handlePaymentStatusChange(pay.id, 'rejected')}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition-all border border-rose-100 flex items-center gap-1 shadow-sm"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>{t.reject}</span>
                      </button>
                    </div>
                  ) : (
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                      pay.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {pay.status.toUpperCase()}
                    </span>
                  )}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{pay.id} • {pay.userEmail}</span>
                    <h5 className="font-extrabold text-indigo-950 text-xs mt-0.5">{pay.method}</h5>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] font-mono">
                  <div>
                    <span className="text-slate-400 block font-bold">{lang === 'ar' ? 'المبلغ الفعلي' : 'Cash Paid'}</span>
                    <span className="text-slate-800 font-bold">{pay.amountCash}$</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">{lang === 'ar' ? 'النقاط المستحقة' : 'Points Credited'}</span>
                    <span className="text-emerald-700 font-bold">{pay.amountPoints}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-slate-400 block font-bold">Transaction ID</span>
                    <span className="text-slate-700 font-bold text-[9px] truncate block">{pay.transactionId}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
