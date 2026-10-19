import React, { useState, useMemo } from 'react';
import {
  Award,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  Download,
  Info,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Employee, DukItem, DukPeriod, AppSettings } from '../types';
import { sortPnsDuk, sortPppkRegister, sortNonAsnRegister } from '../utils/dukRanking';
import { exportDukToExcel, exportDukToPdf, exportDukToHtml } from '../services/exportService';

interface DukViewProps {
  employees: Employee[];
  activePeriod?: DukPeriod | null;
  settings?: AppSettings | null;
  onDetail: (emp: Employee) => void;
  onOpenPrint: (items: DukItem[], title: string) => void;
}

export const DukView: React.FC<DukViewProps> = ({
  employees,
  activePeriod,
  settings,
  onDetail,
  onOpenPrint,
}) => {
  const [activeTab, setActiveTab] = useState<'pns' | 'pppk' | 'non_asn' | 'semua'>('pns');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGolongan, setFilterGolongan] = useState('ALL');
  const [selectedReasonItem, setSelectedReasonItem] = useState<DukItem | null>(null);
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  // Column visibility settings
  const [visibleCols, setVisibleCols] = useState({
    ttl: true,
    pendidikan: true,
    pangkatGol: true,
    tmtPangkat: true,
    jabatan: true,
    tmtJabatan: true,
    tmtSekolah: true, // WAJIB
    mkg: true,
    mkt: true,
    jk: true,
    keterangan: true,
  });

  // Calculate sorted items based on tab
  const pnsItems = useMemo(() => sortPnsDuk(employees), [employees]);
  const pppkItems = useMemo(() => sortPppkRegister(employees), [employees]);
  const nonAsnItems = useMemo(() => sortNonAsnRegister(employees), [employees]);

  // Combined all
  const allItems = useMemo(() => {
    let index = 1;
    const combined: DukItem[] = [];
    pnsItems.forEach((it) => combined.push({ ...it, noUrut: index++ }));
    pppkItems.forEach((it) => combined.push({ ...it, noUrut: index++ }));
    nonAsnItems.forEach((it) => combined.push({ ...it, noUrut: index++ }));
    return combined;
  }, [pnsItems, pppkItems, nonAsnItems]);

  const currentTabItems = useMemo(() => {
    switch (activeTab) {
      case 'pns':
        return pnsItems;
      case 'pppk':
        return pppkItems;
      case 'non_asn':
        return nonAsnItems;
      case 'semua':
        return allItems;
    }
  }, [activeTab, pnsItems, pppkItems, nonAsnItems, allItems]);

  // Filter by search & golongan
  const displayedItems = useMemo(() => {
    return currentTabItems.filter((item) => {
      if (filterGolongan !== 'ALL') {
        if (!item.pangkatGolonganText.includes(filterGolongan)) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nama = item.employee.namaLengkap.toLowerCase();
        const nip = (item.employee.nip || '').toLowerCase();
        const jab = (item.employee.jabatanUtama || '').toLowerCase();
        return nama.includes(q) || nip.includes(q) || jab.includes(q);
      }
      return true;
    });
  }, [currentTabItems, filterGolongan, searchTerm]);

  // Status DUK
  const hasIncomplete = pnsItems.some((it) => !it.isLengkap);
  const statusDukText = hasIncomplete ? 'DRAF — PERLU VERIFIKASI DATA' : 'TELAH DIVERIFIKASI / RESMI';

  const getTabTitle = () => {
    switch (activeTab) {
      case 'pns':
        return 'Daftar Urut Kepangkatan (DUK) Pegawai Negeri Sipil';
      case 'pppk':
        return 'Rekapitulasi Daftar Pegawai Pemerintah dengan Perjanjian Kerja (PPPK)';
      case 'non_asn':
        return 'Rekapitulasi Tenaga Non-ASN / Honorer';
      case 'semua':
        return 'Rekapitulasi Keseluruhan Pegawai';
    }
  };

  const handleExportExcel = () => {
    exportDukToExcel(displayedItems, getTabTitle(), settings || undefined);
  };

  const handleExportPdf = () => {
    exportDukToPdf(
      displayedItems,
      getTabTitle(),
      activePeriod?.namaPeriode || 'Periode 1 Januari 2026',
      settings || undefined
    );
  };

  const handleExportHtml = () => {
    exportDukToHtml(
      displayedItems,
      getTabTitle(),
      activePeriod?.namaPeriode || 'Periode 1 Januari 2026',
      settings || undefined
    );
  };

  const handleTriggerPrint = () => {
    onOpenPrint(displayedItems, getTabTitle());
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {getTabTitle()}
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                hasIncomplete
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
              }`}
            >
              {statusDukText}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Periode Acuan: <span className="font-semibold">{activePeriod?.namaPeriode || 'Periode 1 Januari 2026'}</span> • Standar PP No. 15 Thn 1979 jo. Ketentuan BKN
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowColumnConfig(!showColumnConfig)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Atur Kolom</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Ekspor PDF</span>
          </button>
          <button
            onClick={handleExportHtml}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs"
            title="Unduh berkas HTML mandiri offline yang dapat dibuka di peramban mana saja"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Unduh HTML</span>
          </button>
          <button
            onClick={handleTriggerPrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* Column Config Dropdown if opened */}
      {showColumnConfig && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <p className="font-bold text-slate-900 dark:text-white mb-2">Pilih Kolom yang Ditampilkan:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {Object.keys(visibleCols).map((k) => (
              <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={k === 'tmtSekolah'} // Wajib tampil
                  checked={(visibleCols as any)[k]}
                  onChange={(e) => setVisibleCols({ ...visibleCols, [k]: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span className="capitalize">{k === 'tmtSekolah' ? 'TMT SDN Lanas 1 (Wajib)' : k}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Filter (PNS vs PPPK vs Non-ASN vs Semua) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl px-4 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pns')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'pns'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>1. DUK Resmi PNS ({pnsItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pppk')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'pppk'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Rekapitulasi PPPK ({pppkItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('non_asn')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'non_asn'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>3. Rekapitulasi Non-ASN ({nonAsnItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('semua')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'semua'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>4. Seluruh Pegawai ({allItems.length})</span>
        </button>
      </div>

      {/* Rules Notice Box for PNS DUK */}
      {activeTab === 'pns' && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 border border-slate-800">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-400">Hierarki Urutan Resmi BKN:</span>{' '}
              <span className="text-slate-300">
                1. Pangkat/Golongan &rarr; 2. TMT Pangkat &rarr; 3. Jabatan &rarr; 4. Masa Kerja Golongan &rarr; 5. Pendidikan &rarr; 6. Usia (Lahir Lebih Awal).
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 shrink-0 italic">
            *Klik tombol "?" pada nomor urut untuk detail kriteria
          </span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NIP, atau jabatan..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {activeTab === 'pns' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Filter Golongan:</span>
            <select
              value={filterGolongan}
              onChange={(e) => setFilterGolongan(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ALL">Semua Golongan</option>
              <option value="IV/">Golongan IV</option>
              <option value="III/">Golongan III</option>
              <option value="II/">Golongan II</option>
              <option value="I/">Golongan I</option>
            </select>
          </div>
        )}
      </div>

      {/* Official 14-Column Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-900 text-white dark:bg-slate-950 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-12 text-center">1. No</th>
                <th className="py-3 px-4 min-w-[180px]">2. Nama Lengkap & 3. NIP</th>
                {visibleCols.ttl && <th className="py-3 px-3 min-w-[140px]">4. TTL & Usia</th>}
                {visibleCols.pendidikan && <th className="py-3 px-3 min-w-[140px]">5. Pendidikan Terakhir</th>}
                {visibleCols.pangkatGol && <th className="py-3 px-3 min-w-[130px]">6. Pangkat / Gol.</th>}
                {visibleCols.tmtPangkat && <th className="py-3 px-3 text-center">7. TMT Pangkat</th>}
                {visibleCols.jabatan && <th className="py-3 px-4 min-w-[140px]">8. Jabatan</th>}
                {visibleCols.tmtJabatan && <th className="py-3 px-3 text-center">9. TMT Jab.</th>}
                {visibleCols.tmtSekolah && (
                  <th className="py-3 px-3 bg-amber-500/15 text-amber-400 text-center font-bold">
                    10. TMT di SDN Lanas 1
                  </th>
                )}
                {visibleCols.mkg && <th className="py-3 px-3 text-center">11. MK Gol</th>}
                {visibleCols.mkt && <th className="py-3 px-3 text-center">12. MK Total</th>}
                {visibleCols.jk && <th className="py-3 px-2 text-center">13. JK</th>}
                {visibleCols.keterangan && <th className="py-3 px-3">14. Ket.</th>}
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada pegawai pada daftar ini.
                  </td>
                </tr>
              ) : (
                displayedItems.map((item) => {
                  const e = item.employee;
                  return (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* 1. No Urut dengan Tombol Alasan Urutan */}
                      <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center justify-center gap-1">
                          <span>{item.noUrut}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedReasonItem(item)}
                            title="Lihat dasar kriteria urutan pegawai ini"
                            className="p-0.5 rounded text-slate-400 hover:text-amber-500"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* 2. Nama & 3. NIP */}
                      <td className="py-3 px-4">
                        <p
                          className="font-bold text-slate-900 dark:text-white hover:text-amber-500 cursor-pointer"
                          onClick={() => onDetail(e)}
                        >
                          {e.gelarDepan ? `${e.gelarDepan} ` : ''}
                          {e.namaLengkap}
                          {e.gelarBelakang ? `, ${e.gelarBelakang}` : ''}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500">
                          NIP: {e.nip || '-'}
                        </p>
                        {!item.isLengkap && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300">
                            Kurang: {item.missingDataNotes.join(', ')}
                          </span>
                        )}
                      </td>

                      {/* 4. TTL */}
                      {visibleCols.ttl && (
                        <td className="py-3 px-3">
                          <p>{item.ttlFormatted}</p>
                          <p className="text-[10px] text-slate-400">Usia {item.usiaTahun} Thn</p>
                        </td>
                      )}

                      {/* 5. Pendidikan */}
                      {visibleCols.pendidikan && (
                        <td className="py-3 px-3">
                          <p className="font-medium">{item.pendidikanFormatted}</p>
                          <p className="text-[10px] text-slate-400">Lulus {e.tahunLulus || '-'}</p>
                        </td>
                      )}

                      {/* 6. Pangkat / Gol */}
                      {visibleCols.pangkatGol && (
                        <td className="py-3 px-3">
                          <p className="font-bold text-amber-600 dark:text-amber-400">
                            {item.pangkatGolonganText}
                          </p>
                        </td>
                      )}

                      {/* 7. TMT Pangkat */}
                      {visibleCols.tmtPangkat && (
                        <td className="py-3 px-3 text-center font-mono">
                          {item.tmtPangkatFormatted}
                        </td>
                      )}

                      {/* 8. Jabatan */}
                      {visibleCols.jabatan && (
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {item.jabatanFormatted}
                          </p>
                          {e.jabatanTambahan && (
                            <p className="text-[10px] text-slate-400 italic">
                              {e.jabatanTambahan}
                            </p>
                          )}
                        </td>
                      )}

                      {/* 9. TMT Jabatan */}
                      {visibleCols.tmtJabatan && (
                        <td className="py-3 px-3 text-center font-mono">
                          {item.tmtJabatanFormatted}
                        </td>
                      )}

                      {/* 10. TMT di SDN Lanas 1 (WAJIB TERSENDIRI) */}
                      {visibleCols.tmtSekolah && (
                        <td className="py-3 px-3 text-center font-mono font-bold bg-amber-500/10 text-slate-900 dark:text-white">
                          {item.tmtSekolahFormatted}
                        </td>
                      )}

                      {/* 11. MK Gol */}
                      {visibleCols.mkg && (
                        <td className="py-3 px-3 text-center font-semibold">
                          {item.mkGolonganFormatted}
                        </td>
                      )}

                      {/* 12. MK Total */}
                      {visibleCols.mkt && (
                        <td className="py-3 px-3 text-center font-semibold text-slate-600 dark:text-slate-400">
                          {item.mkKeseluruhanFormatted}
                        </td>
                      )}

                      {/* 13. JK */}
                      {visibleCols.jk && (
                        <td className="py-3 px-2 text-center font-bold">
                          {e.jenisKelamin}
                        </td>
                      )}

                      {/* 14. Keterangan */}
                      {visibleCols.keterangan && (
                        <td className="py-3 px-3 text-[11px] text-slate-500">
                          {e.keterangan || '-'}
                        </td>
                      )}

                      {/* Detail action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onDetail(e)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Lihat Profil Lengkap"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center text-xs text-slate-500">
          <span>Menampilkan {displayedItems.length} dari {currentTabItems.length} pegawai pada {getTabTitle()}</span>
          <span className="font-semibold text-amber-700 dark:text-amber-400">
            Kolom 10 (TMT di Sekolah Ini) Terpisah dan Terverifikasi
          </span>
        </div>
      </div>

      {/* Modal Penjelasan Kriteria Urutan Resmi */}
      {selectedReasonItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Dasar Urutan DUK Resmi
                </h3>
              </div>
              <button
                onClick={() => setSelectedReasonItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="font-bold text-slate-900 dark:text-white">
                  Nomor Urut #{selectedReasonItem.noUrut}: {selectedReasonItem.employee.namaLengkap}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  NIP: {selectedReasonItem.employee.nip || '-'}
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase text-[10px] tracking-wider">
                  Evaluasi Kriteria Penentu Urutan:
                </p>
                <div className="space-y-1.5">
                  {selectedReasonItem.alasanUrutan.map((alasan, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      {alasan}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                <p className="font-semibold">Aturan Pengurutan Resmi:</p>
                <p>
                  Urutan ditentukan secara cascading tanpa alfabetis. Jika kriteria ke-1 sama, diperbandingkan kriteria ke-2, dan seterusnya hingga kriteria ke-6 (usia kelahiran).
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                onClick={() => setSelectedReasonItem(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
