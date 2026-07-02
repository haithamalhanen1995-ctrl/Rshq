import React, { useState } from 'react';
import { translations, Language } from '../lib/translations';
import { 
  MessageSquareCode, 
  Send, 
  Mail, 
  PhoneCall, 
  HelpCircle, 
  X, 
  ShieldAlert, 
  MessageSquare, 
  Zap, 
  User 
} from 'lucide-react';

interface ContactBtnProps {
  lang: Language;
}

export default function ContactBtn({ lang }: ContactBtnProps) {
  const [isOpen, setIsOpen] = useState(false);

  const t = translations[lang];

  const contactOptions = [
    {
      name: 'WhatsApp Support',
      ar: 'المساعدة الفورية عبر واتساب',
      detail: '07502302723',
      icon: MessageSquare,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
      link: 'https://wa.me/9647502302723'
    },
    {
      name: 'Telegram Channel',
      ar: 'قناة تلكرام',
      detail: '@predatorxi',
      icon: Send,
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20',
      link: 'https://t.me/predatorxi'
    },
    {
      name: 'Email Service Desk',
      ar: 'البريد الإلكتروني للإدارة والدعم',
      detail: 'haithamzaidalqsaap@gmail.com',
      icon: Mail,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20',
      link: 'mailto:haithamzaidalqsaap@gmail.com'
    }
  ];

  return (
    <>
      {/* Floating Action Support Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-5 z-40 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-4 rounded-full shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center border border-emerald-400/30"
        title={t.contactUs}
      >
        <MessageSquareCode className="w-6 h-6 animate-pulse" />
      </button>

      {/* Modern Dialog Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-fade-in"
            onClick={e => e.stopPropagation()}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header banner */}
            <div className="p-6 pb-4 border-b border-slate-800/80 flex items-start justify-between">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white bg-slate-950 p-2 rounded-xl border border-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-right">
                <h3 className="text-lg font-black text-white">{t.contactTitle}</h3>
                <p className="text-slate-400 text-xs mt-1">{t.contactSub}</p>
              </div>
            </div>

            {/* Support list */}
            <div className="p-6 space-y-3">
              {contactOptions.map(option => {
                const IconComp = option.icon;
                return (
                  <a
                    key={option.name}
                    href={option.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all text-right ${option.color}`}
                  >
                    <IconComp className="w-5 h-5 shrink-0" />
                    <div className="text-right flex-1">
                      <span className="font-bold text-xs block text-white">
                        {lang === 'ar' ? option.ar : option.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                        {option.detail}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Secure certification seal footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-850 flex items-center justify-center gap-2 text-[10px] text-slate-500">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>
                {lang === 'ar' ? 'جميع حقوق البرمجة والتصميم محفوظة لمنصة النعيمي 2026' : 'Copyright 2026 Al-Nuaimi Platform. All rights reserved.'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
