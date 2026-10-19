import React, { useState } from 'react';
import {
  School,
  ShieldCheck,
  LogIn,
  CheckCircle2,
  Lock,
  Building2,
  UserCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppSettings } from '../types';

interface LoginPageProps {
  settings?: AppSettings | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ settings }) => {
  const { login, loading, connectionStatus, connectionMessage } = useAuth();
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = async () => {
    setErrorNotice(null);
    setIsLoggingIn(true);
    try {
      await login();
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        setErrorNotice(
          'Jendela popup login diblokir oleh browser. Harap izinkan popup di peramban Anda untuk melanjutkan login Google.'
        );
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setErrorNotice('Jendela login ditutup sebelum verifikasi selesai.');
      } else {
        setErrorNotice(err?.message || 'Gagal melakukan login dengan Google.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const schoolName = settings?.namaSekolah || 'UPTD SPF SD NEGERI LANAS 1';
  const kec = settings?.kecamatan || 'Botolinggo';
  const kab = settings?.kabupaten || 'Bondowoso';
  const ks = settings?.namaKepalaSekolah || 'Sahwanto, S.Pd.';
  const nipKs = settings?.nipKepalaSekolah || '19680512 199303 1 008';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none"></div>

      {/* Top Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-amber-500/20">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide text-white">SI-DUK SMART</h1>
            <p className="text-[11px] text-amber-400 font-medium">UPTD SPF SD Negeri Lanas 1</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
          <CheckCircle2
            className={`w-3.5 h-3.5 ${
              connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          />
          <span className="hidden sm:inline">Basis Data Cloud Firestore:</span>
          <span className="font-bold text-slate-200">
            {connectionStatus === 'connected' ? 'Aktif' : 'Terhubung'}
          </span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-slate-900/90 rounded-3xl border border-slate-800 p-8 shadow-2xl space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Portal Kepegawaian Resmi
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sistem Informasi Daftar Urut Kepangkatan (DUK)<br />
              <strong className="text-slate-200">{schoolName}</strong>
              <br />
              Kecamatan {kec}, Kabupaten {kab}
            </p>
          </div>

          {/* Security & Access Restriction Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Autentikasi & Keamanan Wajib</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sesuai ketentuan keamanan data kepegawaian aparatur sipil negara, akses data master, DUK, dan dokumen hanya diberikan kepada pengguna terdaftar.
            </p>
          </div>

          {errorNotice && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Login Action */}
          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn || loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {isLoggingIn ? 'Menghubungkan ke Google...' : 'Masuk dengan Akun Google Resmi'}
              </span>
            </button>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 text-center">
              <span>Akun Utama Terverifikasi:</span>
              <p className="font-mono text-amber-400 font-semibold mt-0.5 truncate">
                sahwanto41@admin.sd.belajar.id
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                (Peran Otomatis: Administrator & Kepala Sekolah)
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-900 text-center text-[11px] text-slate-600 relative z-10">
        SI-DUK SMART • UPTD SPF SD Negeri Lanas 1, Kec. Botolinggo, Kab. Bondowoso, Jawa Timur • Cloud Firestore Protected
      </footer>
    </div>
  );
};
