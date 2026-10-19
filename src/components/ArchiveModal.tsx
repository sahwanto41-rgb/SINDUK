import React, { useState } from 'react';
import { X, Archive, AlertTriangle } from 'lucide-react';
import { Employee, StatusAktif } from '../types';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onConfirm: (
    id: string,
    nama: string,
    status: 'MUTASI_KELUAR' | 'PENSIUN' | 'CUTI' | 'TIDAK_AKTIF',
    alasan: string
  ) => Promise<void>;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  employee,
  onConfirm,
}) => {
  const [status, setStatus] = useState<'MUTASI_KELUAR' | 'PENSIUN' | 'CUTI' | 'TIDAK_AKTIF'>('MUTASI_KELUAR');
  const [alasan, setAlasan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alasan.trim()) return;

    try {
      setIsSubmitting(true);
      await onConfirm(employee.id, employee.namaLengkap, status, alasan.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Archive className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Arsipkan Pegawai</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Perhatian Pengarsipan</p>
              <p>
                Pegawai <strong>{employee.namaLengkap}</strong> akan dinonaktifkan dari DUK aktif SDN Lanas 1, namun seluruh riwayat data akan tetap tersimpan permanen di arsip.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status Pengarsipan Baru
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="MUTASI_KELUAR">Mutasi Keluar ke Sekolah Lain</option>
              <option value="PENSIUN">Pensiun (BUP / Pensiun Dini)</option>
              <option value="CUTI">Cuti di Luar Tanggungan Negara</option>
              <option value="TIDAK_AKTIF">Tidak Aktif / Mengundurkan Diri</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alasan Pengarsipan / Nomor SK <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Contoh: Mutasi ke SDN Botolinggo 2 berdasarkan SK Kadisdik No. 824.3/120/2026"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Arsipkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
