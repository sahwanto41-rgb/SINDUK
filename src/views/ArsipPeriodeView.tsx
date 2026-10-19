import React, { useState } from 'react';
import {
  Archive,
  Plus,
  Calendar,
  CheckCircle2,
  Lock,
  Printer,
  FileText,
  AlertTriangle,
  History,
  Eye,
  GitCompare,
} from 'lucide-react';
import { DukPeriod, DukSnapshot, Employee, DukItem, AppSettings } from '../types';
import { formatTanggalIndonesia, formatTanggalSingkat } from '../utils/dukRanking';
import { getDukSnapshot } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';

interface ArsipPeriodeViewProps {
  periods: DukPeriod[];
  employees: Employee[];
  settings?: AppSettings | null;
  onCreatePeriod: (period: DukPeriod) => Promise<void>;
  onUpdateStatus: (
    periodId: string,
    status: 'DRAFT' | 'DIPERIKSA' | 'DISAHKAN',
    pengesahName?: string,
    nip?: string
  ) => Promise<void>;
  onOpenPrintSnapshot: (items: DukItem[], title: string, periode: string) => void;
}

export const ArsipPeriodeView: React.FC<ArsipPeriodeViewProps> = ({
  periods,
  employees,
  settings,
  onCreatePeriod,
  onUpdateStatus,
  onOpenPrintSnapshot,
}) => {
  const { userProfile } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [namaPeriode, setNamaPeriode] = useState('');
  const [tahun, setTahun] = useState(2026);
  const [tanggalAcuan, setTanggalAcuan] = useState(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState('');

  // Snapshot Viewer Modal
  const [viewingSnapshot, setViewingSnapshot] = useState<{
    snapshot: DukSnapshot;
    items: DukItem[];
  } | null>(null);
  const [loadingSnap, setLoadingSnap] = useState(false);

  // Period Comparison State
  const [comparePeriodA, setComparePeriodA] = useState<string>('');
  const [comparePeriodB, setComparePeriodB] = useState<string>('');
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<{
    periodAName: string;
    periodBName: string;
    promotions: string[];
    newStaff: string[];
  } | null>(null);

  const canCertify =
    userProfile?.role === 'admin' || userProfile?.role === 'kepala_sekolah';

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPeriode.trim()) return;

    const newPeriod: DukPeriod = {
      id: `periode-${Date.now()}`,
      namaPeriode: namaPeriode.trim(),
      tahun,
      tanggalAcuan,
      status: 'DRAFT',
      keterangan: keterangan.trim(),
      jumlahPegawai: employees.length,
      jumlahPns: employees.filter((e) => e.statusKepegawaian === 'PNS').length,
      jumlahPppk: employees.filter((e) => e.statusKepegawaian === 'PPPK').length,
      jumlahNonAsn: employees.filter((e) => e.statusKepegawaian === 'NON_ASN').length,
      isAktif: false,
      createdBy: userProfile?.displayName || userProfile?.email || 'Administrator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onCreatePeriod(newPeriod);
    setShowCreateModal(false);
    setNamaPeriode('');
  };

  const handleViewSnapshot = async (period: DukPeriod) => {
    setLoadingSnap(true);
    try {
      const snap = await getDukSnapshot(period.id);
      if (snap && snap.snapshotData) {
        const items: DukItem[] = JSON.parse(snap.snapshotData);
        setViewingSnapshot({ snapshot: snap, items });
      } else {
        alert('Snapshot data belum dibekukan untuk periode ini karena statusnya masih DRAF atau DIPERIKSA.');
      }
    } catch (err: any) {
      alert(`Gagal memuat snapshot: ${err.message}`);
    } finally {
      setLoadingSnap(false);
    }
  };

  const handleCompare = async () => {
    if (!comparePeriodA || !comparePeriodB) return;
    try {
      const [snapA, snapB] = await Promise.all([
        getDukSnapshot(comparePeriodA),
        getDukSnapshot(comparePeriodB),
      ]);

      const itemsA: DukItem[] = snapA ? JSON.parse(snapA.snapshotData) : [];
      const itemsB: DukItem[] = snapB ? JSON.parse(snapB.snapshotData) : [];

      const promotions: string[] = [];
      const newStaff: string[] = [];

      const nipsA = new Set(itemsA.map((x) => x.employee.nip));

      itemsB.forEach((b) => {
        if (!nipsA.has(b.employee.nip)) {
          newStaff.push(`${b.employee.namaLengkap} (${b.employee.statusKepegawaian}) - Pegawai Baru`);
        } else {
          const prev = itemsA.find((x) => x.employee.nip === b.employee.nip);
          if (prev && prev.employee.golonganRuang !== b.employee.golonganRuang) {
            promotions.push(
              `${b.employee.namaLengkap}: Naik Golongan dari ${prev.employee.golonganRuang || '-'} ke ${b.employee.golonganRuang}`
            );
          }
        }
      });

      const pA = periods.find((x) => x.id === comparePeriodA);
      const pB = periods.find((x) => x.id === comparePeriodB);

      setComparisonResult({
        periodAName: pA?.namaPeriode || comparePeriodA,
        periodBName: pB?.namaPeriode || comparePeriodB,
        promotions,
        newStaff,
      });
      setShowCompareModal(true);
    } catch (err: any) {
      alert(`Gagal membandingkan snapshot: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-500" />
            <span>Arsip & Snapshot Periode DUK</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen periode acuan, riwayat pengesahan Kepala Sekolah, dan snapshot data permanen yang tidak dapat diubah
          </p>
        </div>

        <div className="flex items-center gap-2">
          {periods.length >= 2 && (
            <button
              onClick={() => {
                setComparePeriodA(periods[1]?.id || periods[0]?.id);
                setComparePeriodB(periods[0]?.id);
                handleCompare();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              <GitCompare className="w-4 h-4 text-purple-500" />
              <span>Bandingkan Periode</span>
            </button>
          )}

          {canCertify && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Periode Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Periods List */}
      <div className="space-y-3">
        {periods.map((period) => {
          const isDisahkan = period.status === 'DISAHKAN';

          return (
            <div
              key={period.id}
              className={`p-5 rounded-2xl border transition shadow-xs ${
                isDisahkan
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {period.namaPeriode}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isDisahkan
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                          : period.status === 'DIPERIKSA'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
                      }`}
                    >
                      {period.status}
                    </span>
                    {period.isAktif && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        Aktif Saat Ini
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    Tanggal Acuan: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatTanggalIndonesia(period.tanggalAcuan)}</span> • Jumlah Pegawai: {period.jumlahPegawai} (PNS: {period.jumlahPns}, PPPK: {period.jumlahPppk}, Non-ASN: {period.jumlahNonAsn})
                  </p>

                  {isDisahkan && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                      ✓ Disahkan oleh Kepala Sekolah: <strong>{period.pejabatPengesah || 'Sahwanto, S.Pd.'}</strong> pada {formatTanggalIndonesia(period.tanggalPengesahan)} • NIP. {period.nipPengesah || '19680512 199303 1 008'}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isDisahkan ? (
                    <button
                      onClick={() => handleViewSnapshot(period)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90 transition"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Buka Snapshot Terkunci</span>
                    </button>
                  ) : (
                    <>
                      {canCertify && period.status === 'DRAFT' && (
                        <button
                          onClick={() => onUpdateStatus(period.id, 'DIPERIKSA')}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
                        >
                          Kirim untuk Diperiksa
                        </button>
                      )}
                      {canCertify && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Sahkan periode "${period.namaPeriode}" sekarang? Tindakan ini akan mengunci nomor urut dan data snapshot permanen.`
                              )
                            ) {
                              onUpdateStatus(
                                period.id,
                                'DISAHKAN',
                                settings?.namaKepalaSekolah || 'Sahwanto, S.Pd.',
                                settings?.nipKepalaSekolah || '19680512 199303 1 008'
                              );
                            }
                          }}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Sahkan & Bekukan Snapshot</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL LIHAT SNAPSHOT TERKUNCI */}
      {viewingSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-5xl my-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Snapshot DUK Resmi: {viewingSnapshot.snapshot.periodName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Disahkan oleh: {viewingSnapshot.snapshot.disahkanOleh} (NIP. {viewingSnapshot.snapshot.nipPengesah}) • Tanggal: {formatTanggalIndonesia(viewingSnapshot.snapshot.tanggalPengesahan)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onOpenPrintSnapshot(
                      viewingSnapshot.items,
                      'ARSIP RESMI SNAPSHOT DAFTAR URUT KEPANGKATAN PNS',
                      viewingSnapshot.snapshot.periodName
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-600"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Ulang Snapshot</span>
                </button>
                <button
                  onClick={() => setViewingSnapshot(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
              <p className="font-semibold">Snapshot Data Permanen (Immutable)</p>
              <p className="text-[11px]">
                Data ini tidak akan terpengaruh oleh perubahan, mutasi, atau promosi pegawai di masa mendatang. Mencerminkan kondisi resmi saat pengesahan.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-900 text-white font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 text-center">No</th>
                    <th className="py-2.5 px-3">Nama Lengkap & NIP</th>
                    <th className="py-2.5 px-3">Pangkat / Gol.</th>
                    <th className="py-2.5 px-3 text-center">TMT Pangkat</th>
                    <th className="py-2.5 px-3">Jabatan</th>
                    <th className="py-2.5 px-3 text-center bg-amber-500/20 text-amber-300">TMT di SDN Lanas 1</th>
                    <th className="py-2.5 px-3 text-center">MK Gol</th>
                    <th className="py-2.5 px-3">Pendidikan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {viewingSnapshot.items.map((item) => (
                    <tr key={item.employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-center font-bold">{item.noUrut}</td>
                      <td className="py-2 px-3">
                        <p className="font-bold">{item.employee.namaLengkap}</p>
                        <p className="font-mono text-[10px] text-slate-500">{item.employee.nip || '-'}</p>
                      </td>
                      <td className="py-2 px-3 font-semibold text-amber-600 dark:text-amber-400">
                        {item.pangkatGolonganText}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{item.tmtPangkatFormatted}</td>
                      <td className="py-2 px-3">{item.jabatanFormatted}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold bg-amber-500/5">
                        {item.tmtSekolahFormatted}
                      </td>
                      <td className="py-2 px-3 text-center">{item.mkGolonganFormatted}</td>
                      <td className="py-2 px-3">{item.pendidikanFormatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setViewingSnapshot(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PERIOD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Buat Periode Baru DUK
            </h3>
            <form onSubmit={handleCreatePeriod} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nama Periode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaPeriode}
                  onChange={(e) => setNamaPeriode(e.target.value)}
                  placeholder="Contoh: Periode 1 Juli 2026"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tahun
                  </label>
                  <input
                    type="number"
                    value={tahun}
                    onChange={(e) => setTahun(parseInt(e.target.value, 10) || 2026)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tanggal Acuan
                  </label>
                  <input
                    type="date"
                    value={tanggalAcuan}
                    onChange={(e) => setTanggalAcuan(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Keterangan / Catatan Periode
                </label>
                <textarea
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Catatan penetapan DUK tengah tahun..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-bold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90"
                >
                  Buat Periode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPARISON MODAL */}
      {showCompareModal && comparisonResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-purple-500" />
              <span>Perbandingan Antarperiode DUK</span>
            </h3>
            <p className="text-xs text-slate-500">
              {comparisonResult.periodAName} &rarr; {comparisonResult.periodBName}
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40">
                <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-1">
                  Kenaikan Pangkat / Golongan:
                </h4>
                {comparisonResult.promotions.length === 0 ? (
                  <p className="text-slate-400">Tidak ada kenaikan pangkat antarperiode ini.</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {comparisonResult.promotions.map((p, i) => (
                      <li key={i} className="text-slate-800 dark:text-slate-200">{p}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-1">
                  Pegawai Baru / Mutasi Masuk:
                </h4>
                {comparisonResult.newStaff.length === 0 ? (
                  <p className="text-slate-400">Tidak ada pegawai baru antarperiode ini.</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {comparisonResult.newStaff.map((s, i) => (
                      <li key={i} className="text-slate-800 dark:text-slate-200">{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
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
