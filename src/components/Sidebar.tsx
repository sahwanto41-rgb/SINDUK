import React from 'react';
import {
  LayoutDashboard,
  Users,
  Award,
  History,
  FileText,
  FileSpreadsheet,
  Archive,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  School,
  X,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type NavTab =
  | 'dashboard'
  | 'data-pegawai'
  | 'duk'
  | 'riwayat'
  | 'dokumen'
  | 'impor-ekspor'
  | 'arsip-periode'
  | 'laporan'
  | 'pengguna'
  | 'pengaturan';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'data-pegawai', label: 'Data Pegawai', icon: Users },
    { id: 'duk', label: 'Daftar Urut Kepangkatan', icon: Award },
    { id: 'riwayat', label: 'Riwayat Kepegawaian', icon: History },
    { id: 'dokumen', label: 'Dokumen Kepegawaian', icon: FileText },
    { id: 'impor-ekspor', label: 'Impor dan Ekspor', icon: FileSpreadsheet },
    { id: 'arsip-periode', label: 'Arsip Periode DUK', icon: Archive },
    { id: 'laporan', label: 'Laporan Rekapitulasi', icon: BarChart3 },
    { id: 'pengguna', label: 'Pengguna & Hak Akses', icon: ShieldCheck },
    { id: 'pengaturan', label: 'Pengaturan Aplikasi', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id as NavTab);
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-200 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-68'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-18 px-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-900/20 shrink-0">
              <School className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="block font-bold text-base tracking-wide text-white">SI-DUK SMART</span>
                <span className="block text-[11px] font-medium text-amber-400 truncate">SDN Lanas 1 Botolinggo</span>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Institution Badge when expanded */}
        {!collapsed && (
          <div className="mx-3 mt-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
            <p className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Instansi Resmi</p>
            <p className="font-semibold text-slate-200">UPTD SPF SD Negeri Lanas 1</p>
            <p className="text-slate-400 text-[11px]">Kabupaten Bondowoso</p>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* PWA Install Button when expanded */}
        {!collapsed && <PWAInstallButton variant="sidebar" />}

        {/* Footer Collapse Button */}
        <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-800 bg-slate-950/30">
          {!collapsed && (
            <div className="text-[11px] text-slate-400">
              <span>Versi 1.0 • Terpadu</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  );
};
