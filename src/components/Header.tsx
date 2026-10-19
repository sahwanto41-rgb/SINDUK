import React, { useState } from 'react';
import {
  Menu,
  Database,
  Calendar,
  UserCheck,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DukPeriod, AppSettings, UserRole } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  sidebarCollapsed: boolean;
  setMobileOpen: (v: boolean) => void;
  activePeriod?: DukPeriod | null;
  settings?: AppSettings | null;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarCollapsed,
  setMobileOpen,
  activePeriod,
  settings,
  darkMode,
  setDarkMode,
}) => {
  const {
    user,
    userProfile,
    connectionStatus,
    connectionMessage,
    login,
    logout,
    switchRoleForDemo,
    checkConnectionNow,
    isDemoMode,
  } = useAuth();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [isRefreshingConn, setIsRefreshingConn] = useState(false);

  const handleRefreshConn = async () => {
    setIsRefreshingConn(true);
    await checkConnectionNow();
    setTimeout(() => setIsRefreshingConn(false), 500);
  };

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'operator':
        return 'Operator Kepegawaian';
      case 'kepala_sekolah':
        return 'Kepala Sekolah';
      case 'auditor':
        return 'Pembaca / Auditor';
      default:
        return 'Pengguna';
    }
  };

  const getRoleColor = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 'operator':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'kepala_sekolah':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'auditor':
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between h-18 px-4 lg:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-68'
      }`}
    >
      {/* Left: Mobile Trigger & School Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm lg:text-base font-bold text-slate-900 dark:text-white leading-tight">
              {settings?.namaSekolah || 'UPTD SPF SD Negeri Lanas 1'}
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Kec. {settings?.kecamatan || 'Botolinggo'}
            </span>
          </div>
          {settings?.tampilkanPenanggungJawabHeader ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
              Kepala Sekolah: <span className="font-semibold text-slate-700 dark:text-slate-300">{settings?.namaKepalaSekolah || 'Sahwanto, S.Pd.'}</span>
              <span className="hidden md:inline"> • NIP: {settings?.nipKepalaSekolah || '19680512 199303 1 008'}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
              Kec. {settings?.kecamatan || 'Botolinggo'}, Kab. {settings?.kabupaten || 'Bondowoso'} • NPSN: {settings?.npsn || '20521884'}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active DUK Period Badge */}
        {activePeriod && (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
            <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="font-medium">{activePeriod.namaPeriode}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                activePeriod.status === 'DISAHKAN'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              }`}
            >
              {activePeriod.status}
            </span>
          </div>
        )}

        {/* Firestore Database Status Badge */}
        <div
          onClick={handleRefreshConn}
          title={connectionMessage}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs cursor-pointer select-none transition border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
        >
          {connectionStatus === 'connected' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : connectionStatus === 'checking' ? (
            <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${isRefreshingConn ? 'animate-spin' : ''}`} />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          )}
          <span className="hidden md:inline font-medium text-slate-700 dark:text-slate-300">
            Firestore: {connectionStatus === 'connected' ? 'Aktif' : 'Offline'}
          </span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* In-App PWA Install Prompt */}
        <PWAInstallButton variant="header" />

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-700 text-amber-400 font-bold flex items-center justify-center text-xs">
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                {userProfile?.displayName || 'Pengguna Sistem'}
              </p>
              <div className="flex items-center gap-1">
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${getRoleColor(userProfile?.role)}`}>
                  {getRoleLabel(userProfile?.role)}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Role & Auth Dropdown */}
          {roleMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setRoleMenuOpen(false)}
            >
              <div className="pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {userProfile?.displayName}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{userProfile?.email}</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                  {isDemoMode ? '★ Mode Simulasi Role Aktif' : '✓ Terautentikasi Firebase'}
                </p>
              </div>

              {/* Role Simulation Switcher for Testing & Verification */}
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Uji Hak Akses (Role Switcher)
                </p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <button
                    onClick={() => switchRoleForDemo('admin')}
                    className={`px-2 py-1.5 rounded-lg text-left text-xs font-medium transition ${
                      userProfile?.role === 'admin'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    1. Admin
                  </button>
                  <button
                    onClick={() => switchRoleForDemo('operator')}
                    className={`px-2 py-1.5 rounded-lg text-left text-xs font-medium transition ${
                      userProfile?.role === 'operator'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    2. Operator
                  </button>
                  <button
                    onClick={() => switchRoleForDemo('kepala_sekolah')}
                    className={`px-2 py-1.5 rounded-lg text-left text-xs font-medium transition ${
                      userProfile?.role === 'kepala_sekolah'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    3. Kepala Sekolah
                  </button>
                  <button
                    onClick={() => switchRoleForDemo('auditor')}
                    className={`px-2 py-1.5 rounded-lg text-left text-xs font-medium transition ${
                      userProfile?.role === 'auditor'
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    4. Auditor
                  </button>
                </div>
              </div>

              {/* Login / Logout Action */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                {user ? (
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar Akun Google
                  </button>
                ) : (
                  <button
                    onClick={login}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90 transition"
                  >
                    <LogIn className="w-4 h-4" />
                    Masuk Akun Google Resmi
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
