import React, { useState } from 'react';
import { History, Filter, Search, Calendar, User, ArrowRight } from 'lucide-react';
import { EmploymentHistory, TipePerubahan } from '../types';
import { formatTanggalSingkat } from '../utils/dukRanking';

interface RiwayatKepegawaianViewProps {
  histories: EmploymentHistory[];
}

export const RiwayatKepegawaianView: React.FC<RiwayatKepegawaianViewProps> = ({ histories }) => {
  const [filterTipe, setFilterTipe] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filtered = histories.filter((h) => {
    if (filterTipe !== 'ALL' && h.tipePerubahan !== filterTipe) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        h.employeeName.toLowerCase().includes(q) ||
        h.alasanPerubahan.toLowerCase().includes(q) ||
        h.diubahOleh.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            <span>Riwayat Kepegawaian & Jejak Audit</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log perubahan pangkat, jabatan, penempatan, pendidikan, dan masa kerja yang disimpan permanen
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          Total Riwayat: {histories.length} Catatan
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pegawai atau alasan perubahan..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={filterTipe}
          onChange={(e) => setFilterTipe(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
        >
          <option value="ALL">Semua Jenis Perubahan</option>
          <option value="PANGKAT">Kenaikan Pangkat</option>
          <option value="JABATAN">Perubahan Jabatan</option>
          <option value="PENEMPATAN">Penempatan / Mutasi</option>
          <option value="PENDIDIKAN">Peningkatan Pendidikan</option>
          <option value="MASA_KERJA">Penyesuaian Masa Kerja</option>
          <option value="STATUS">Perubahan Status Keaktifan</option>
        </select>
      </div>

      {/* Timeline List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Tidak ada data riwayat kepegawaian yang ditemukan.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((item) => (
              <div key={item.id} className="p-4.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wide">
                      {item.tipePerubahan}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.employeeName}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatTanggalSingkat(item.timestamp.split('T')[0])} pukul {item.timestamp.split('T')[1]?.substring(0, 5)} WIB
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">
                      Nilai Sebelum:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">{item.dataSebelum}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5 uppercase">
                      Nilai Sesudah:
                    </span>
                    <p className="font-bold">{item.dataSesudah}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                  <p>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Alasan Perubahan:</span>{' '}
                    "{item.alasanPerubahan}"
                  </p>
                  <p className="text-slate-400">
                    Diubah oleh: <span className="font-medium text-slate-600 dark:text-slate-300">{item.diubahOleh}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
