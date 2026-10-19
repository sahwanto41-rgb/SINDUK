import React, { useState } from 'react';
import { Download, Monitor, Smartphone, Check, X, HelpCircle, HardDrive } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'settings' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed and running standalone
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>Aplikasi Berjalan dalam Mode Aplikasi Mandiri (PWA Desktop / Mobile)</span>
        </div>
      );
    }
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleAction}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all duration-150 cursor-pointer"
          title="Pasang aplikasi SI-DUK SMART ke laptop atau ponsel"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download Aplikasi</span>
          <span className="sm:hidden">App</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <div className="px-3 py-2">
          <button
            onClick={handleAction}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="truncate">Download / Pasang Aplikasi</span>
          </button>
        </div>
      )}

      {variant === 'settings' && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
              <Monitor className="w-4 h-4 text-amber-500" />
              <span>Instal Aplikasi ke Laptop / Komputer (PWA Desktop)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Jalankan SI-DUK SMART secara langsung seperti software desktop tanpa harus membuka peramban web dan mengetik alamat URL setiap saat.
            </p>
          </div>
          <button
            onClick={handleAction}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Pasang Sekarang</span>
          </button>
        </div>
      )}

      {/* Guide & Download Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in fade-in duration-200 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Cara Download & Pasang SI-DUK SMART</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">UPTD SPF SD Negeri Lanas 1</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Option 1: PWA Installation for Desktop (Chrome / Edge) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                  <Monitor className="w-4 h-4" />
                  <span>1. Pasang di Komputer / Laptop (Google Chrome / MS Edge)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  <li>Lihat bagian kanan bilah alamat (URL bar) browser Anda.</li>
                  <li>
                    Klik ikon <strong>“Pasang / Install App”</strong> (simbol komputer kecil bertanda panah bawah atau tombol tambah).
                  </li>
                  <li>
                    Klik <strong>Pasang (Install)</strong>. Ikon <strong>SI-DUK SMART</strong> akan muncul di Desktop dan Menu Mulai Windows layaknya software resmi.
                  </li>
                </ol>
              </div>

              {/* Option 2: Android / iOS Smartphone */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                  <Smartphone className="w-4 h-4" />
                  <span>2. Pasang di Smartphone (Android / iPhone)</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    <strong>Android (Chrome):</strong> Ketuk tombol titik tiga (⋮) di pojok kanan atas, lalu pilih <strong>“Tambahkan ke Layar Utama”</strong> atau <strong>“Pasang Aplikasi”</strong>.
                  </li>
                  <li>
                    <strong>iPhone / iPad (Safari):</strong> Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah, lalu pilih <strong>“Tambahkan ke Layar Utama (Add to Home Screen)”</strong>.
                  </li>
                </ul>
              </div>

              {/* Option 3: Offline HTML & Complete Data Backup */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                  <HardDrive className="w-4 h-4" />
                  <span>3. Unduh Salinan Berkas Mandiri & Cadangan Data</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Anda juga dapat mengunduh seluruh data dalam format <strong>HTML Offline Mandiri</strong>, <strong>Buku Kerja Excel (.xlsx)</strong>, atau <strong>Cadangan Database JSON</strong> melalui menu <em>Impor dan Ekspor</em> serta <em>Pengaturan Aplikasi</em>.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
