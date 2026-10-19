import React from 'react';
import {
  Users,
  Award,
  FileCheck,
  AlertTriangle,
  UserCheck,
  Building2,
  Calendar,
  PlusCircle,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  TrendingUp,
  History,
  GraduationCap,
} from 'lucide-react';
import { Employee, DukPeriod, AuditLog, AppSettings } from '../types';
import { formatTanggalIndonesia, formatTanggalSingkat } from '../utils/dukRanking';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  employees: Employee[];
  activePeriod?: DukPeriod | null;
  auditLogs: AuditLog[];
  settings?: AppSettings | null;
  setActiveTab: (tab: NavTab) => void;
  onAddEmployee: () => void;
  onOpenPrint: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  activePeriod,
  auditLogs,
  settings,
  setActiveTab,
  onAddEmployee,
  onOpenPrint,
}) => {
  // Statistics computed dynamically from database
  const totalPegawai = employees.length;
  const activeEmployees = employees.filter((e) => e.statusAktif === 'AKTIF');
  const countPns = activeEmployees.filter((e) => e.statusKepegawaian === 'PNS').length;
  const countPppk = activeEmployees.filter((e) => e.statusKepegawaian === 'PPPK').length;
  const countNonAsn = activeEmployees.filter((e) => e.statusKepegawaian === 'NON_ASN').length;
  const countGuru = activeEmployees.filter((e) => e.jenisPtk === 'GURU').length;
  const countTendik = activeEmployees.filter((e) => e.jenisPtk === 'TENAGA_KEPENDIDIKAN').length;
  const incompleteDataList = activeEmployees.filter((e) => !e.isDataLengkap);
  const countIncomplete = incompleteDataList.length;

  // Golongan PNS breakdown
  const golPnsCount: Record<string, number> = {};
  activeEmployees
    .filter((e) => e.statusKepegawaian === 'PNS' && e.golonganRuang)
    .forEach((e) => {
      const gol = e.golonganRuang!;
      golPnsCount[gol] = (golPnsCount[gol] || 0) + 1;
    });

  const lastUpdate =
    employees.length > 0
      ? formatTanggalIndonesia(
          employees
            .map((e) => e.updatedAt)
            .sort()
            .reverse()[0]
            ?.split('T')[0]
        )
      : '-';

  return (
    <div className="space-y-6">
      {/* Institution Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-amber-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wide">
                SI-DUK SMART
              </span>
              <span className="text-xs text-amber-300 font-medium">
                Sistem Informasi Daftar Urut Kepangkatan Terpadu
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {settings?.namaSekolah || 'UPTD SPF SD Negeri Lanas 1'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Kecamatan {settings?.kecamatan || 'Botolinggo'}, Kabupaten {settings?.kabupaten || 'Bondowoso'}, Jawa Timur
              {settings?.tampilkanPenanggungJawabHeader ? (
                <> • Kepala Sekolah: <span className="font-semibold text-amber-400">{settings?.namaKepalaSekolah || 'Sahwanto, S.Pd.'}</span></>
              ) : (
                <> • NPSN: <span className="font-semibold text-amber-400">{settings?.npsn || '20521884'}</span></>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onAddEmployee}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Pegawai</span>
            </button>
            <button
              onClick={() => setActiveTab('duk')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Buka DUK</span>
            </button>
            <button
              onClick={onOpenPrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak DUK</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pegawai */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Pegawai</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalPegawai}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {activeEmployees.length} Aktif • {totalPegawai - activeEmployees.length} Arsip/Mutasi
          </p>
        </div>

        {/* PNS */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pegawai Negeri Sipil (PNS)</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{countPns}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            Masuk Hirarki Urutan Resmi DUK
          </p>
        </div>

        {/* PPPK & Non-ASN */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">PPPK & Non-ASN</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{countPppk + countNonAsn}</p>
            <span className="text-xs text-slate-500">
              ({countPppk} PPPK, {countNonAsn} Non-ASN)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Rekapitulasi Register Terpisah</p>
        </div>

        {/* Kelengkapan Data */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Data Belum Lengkap</span>
            <div
              className={`p-2 rounded-lg ${
                countIncomplete > 0
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-600'
              }`}
            >
              {countIncomplete > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <FileCheck className="w-4 h-4" />
              )}
            </div>
          </div>
          <p
            className={`text-2xl font-black ${
              countIncomplete > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {countIncomplete}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {countIncomplete > 0 ? 'Perlu Dilengkapi Operator' : 'Seluruh Data Valid & Lengkap'}
          </p>
        </div>
      </div>

      {/* Grid: Charts/Breakdown & Incomplete Data Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribusi Status & PTK */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Distribusi Status Kepegawaian</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">{activeEmployees.length} Total</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* PNS bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">PNS (Definitif)</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {countPns} ({activeEmployees.length ? Math.round((countPns / activeEmployees.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${activeEmployees.length ? (countPns / activeEmployees.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* PPPK bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">PPPK</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {countPppk} ({activeEmployees.length ? Math.round((countPppk / activeEmployees.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${activeEmployees.length ? (countPppk / activeEmployees.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Non-ASN bar */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Non-ASN / Honorer</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {countNonAsn} ({activeEmployees.length ? Math.round((countNonAsn / activeEmployees.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${activeEmployees.length ? (countNonAsn / activeEmployees.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Guru vs Tendik breakdown */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] text-slate-500 font-medium">Tenaga Pendidik (Guru)</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{countGuru} Orang</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] text-slate-500 font-medium">Tenaga Kependidikan</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{countTendik} Orang</p>
              </div>
            </div>
          </div>
        </div>

        {/* Distribusi Golongan Ruang PNS */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Golongan Ruang PNS Lanas 1</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">{countPns} PNS</span>
          </div>

          <div className="space-y-2 text-xs">
            {Object.keys(golPnsCount).length === 0 ? (
              <p className="text-slate-400 py-6 text-center">Belum ada data PNS dengan golongan terdaftar</p>
            ) : (
              Object.entries(golPnsCount).map(([gol, count]) => (
                <div
                  key={gol}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200">Golongan {gol}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {count} Pegawai
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
            <p className="font-semibold">Periode DUK Aktif:</p>
            <p>{activePeriod?.namaPeriode || 'Periode 1 Januari 2026'}</p>
            <p className="text-[10px] text-slate-500 mt-1">Pembaruan Terakhir: {lastUpdate}</p>
          </div>
        </div>

        {/* Data Belum Lengkap & Tindak Lanjut */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Perlu Dilengkapi</span>
            </h3>
            <span className="text-xs font-bold text-amber-600">{countIncomplete} Data</span>
          </div>

          {incompleteDataList.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs">
              <FileCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="font-bold">Lengkap dan Siap Disahkan</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Semua data pegawai telah memenuhi syarat penentu urutan DUK resmi.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {incompleteDataList.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setActiveTab('data-pegawai')}
                  className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-400 cursor-pointer transition text-xs"
                >
                  <p className="font-bold text-slate-900 dark:text-white">{emp.namaLengkap}</p>
                  <p className="text-[11px] text-slate-500">{emp.statusKepegawaian} • {emp.jabatanUtama}</p>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                    Kurang: {emp.missingFields?.join(', ') || 'Atribut penentu urutan'}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('data-pegawai')}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition"
            >
              <span>Kelola Seluruh Data Pegawai</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activities Audit Log */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Aktivitas & Log Audit Kepegawaian Terbaru
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('riwayat')}
            className="text-xs font-semibold text-slate-500 hover:text-amber-500 transition"
          >
            Lihat Semua
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Belum ada catatan aktivitas tercatat.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{log.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatTanggalSingkat(log.timestamp.split('T')[0])} {log.timestamp.split('T')[1]?.substring(0, 5)}
                  </span>
                  <p className="text-[10px] text-slate-500">{log.userName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
