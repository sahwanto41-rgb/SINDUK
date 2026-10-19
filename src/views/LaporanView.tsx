import React, { useState } from 'react';
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
  Download,
  Award,
  Users,
  UserCheck,
  FileText,
  Calendar,
} from 'lucide-react';
import { Employee, DukItem, AppSettings, DukPeriod } from '../types';
import { sortPnsDuk, sortPppkRegister, sortNonAsnRegister } from '../utils/dukRanking';
import { exportDukToExcel, exportDukToPdf } from '../services/exportService';

interface LaporanViewProps {
  employees: Employee[];
  settings?: AppSettings | null;
  activePeriod?: DukPeriod | null;
  onOpenPrint: (items: DukItem[], title: string) => void;
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  employees,
  settings,
  activePeriod,
  onOpenPrint,
}) => {
  const pnsItems = sortPnsDuk(employees);
  const pppkItems = sortPppkRegister(employees);
  const nonAsnItems = sortNonAsnRegister(employees);

  let idx = 1;
  const allItems: DukItem[] = [];
  pnsItems.forEach((x) => allItems.push({ ...x, noUrut: idx++ }));
  pppkItems.forEach((x) => allItems.push({ ...x, noUrut: idx++ }));
  nonAsnItems.forEach((x) => allItems.push({ ...x, noUrut: idx++ }));

  const reportCards = [
    {
      id: 'duk_pns',
      title: '1. DUK Lengkap Pegawai Negeri Sipil (PNS)',
      desc: 'Daftar resmi urutan kepangkatan PNS SDN Lanas 1 sesuai standar BKN dan Peraturan Pemerintah.',
      count: `${pnsItems.length} Pegawai`,
      items: pnsItems,
      badge: 'Utama',
      icon: Award,
    },
    {
      id: 'rekap_pppk',
      title: '2. Rekapitulasi Daftar Pegawai PPPK',
      desc: 'Daftar pegawai PPPK berdasarkan Golongan (IX/X/dll), TMT SK, nomor perjanjian kerja, dan masa kontrak.',
      count: `${pppkItems.length} Pegawai`,
      items: pppkItems,
      badge: 'PPPK',
      icon: UserCheck,
    },
    {
      id: 'rekap_non_asn',
      title: '3. Rekapitulasi Tenaga Non-ASN / Honorer',
      desc: 'Daftar tenaga honorer, sukwan, dan PTT terurut berdasarkan TMT di SD Negeri Lanas 1.',
      count: `${nonAsnItems.length} Pegawai`,
      items: nonAsnItems,
      badge: 'Non-ASN',
      icon: Users,
    },
    {
      id: 'rekap_all',
      title: '4. Rekapitulasi Profil Seluruh Pegawai',
      desc: 'Daftar komprehensif seluruh pendidik dan tenaga kependidikan definitif dan kontrak di SDN Lanas 1.',
      count: `${allItems.length} Pegawai`,
      items: allItems,
      badge: 'Seluruhnya',
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>Pusat Laporan & Rekapitulasi Resmi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Format laporan siap cetak dan ekspor untuk kebutuhan Dinas Pendidikan, BKD, dan arsip sekolah
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-amber-500" />
          <span>{activePeriod?.namaPeriode || 'Periode 1 Januari 2026'}</span>
        </div>
      </div>

      {/* Grid of Standard Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportCards.map((rep) => {
          const Icon = rep.icon;
          return (
            <div
              key={rep.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-500">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    {rep.badge} • {rep.count}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {rep.title}
                </h3>
                <p className="text-xs text-slate-500">{rep.desc}</p>
              </div>

              {/* Action Buttons for this Report */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => exportDukToExcel(rep.items, rep.title, settings || undefined)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>XLSX</span>
                </button>
                <button
                  onClick={() =>
                    exportDukToPdf(
                      rep.items,
                      rep.title,
                      activePeriod?.namaPeriode || 'Periode 1 Januari 2026',
                      settings || undefined
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => onOpenPrint(rep.items, rep.title)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
