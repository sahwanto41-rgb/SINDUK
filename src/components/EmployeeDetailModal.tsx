import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Award,
  Briefcase,
  MapPin,
  GraduationCap,
  Clock,
  FileText,
  History,
  Edit,
  Archive,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  Plus,
  Trash2,
} from 'lucide-react';
import { Employee, EmploymentHistory, EmployeeDocument, JenisDokumen } from '../types';
import { formatTanggalIndonesia, formatTanggalSingkat, hitungUsia } from '../utils/dukRanking';
import {
  getEmploymentHistory,
  getEmployeeDocuments,
  addEmployeeDocument,
  deleteEmployeeDocument,
} from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onEdit: (emp: Employee) => void;
  onArchive: (emp: Employee) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
  onEdit,
  onArchive,
}) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profil' | 'riwayat' | 'dokumen'>('profil');
  const [histories, setHistories] = useState<EmploymentHistory[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  // New Doc Form Modal State
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocData, setNewDocData] = useState<{
    jenisDokumen: JenisDokumen;
    namaDokumen: string;
    nomorDokumen: string;
    tanggalDokumen: string;
  }>({
    jenisDokumen: 'SK_PANGKAT',
    namaDokumen: '',
    nomorDokumen: '',
    tanggalDokumen: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (employee && isOpen) {
      loadExtras();
    }
  }, [employee, isOpen]);

  const loadExtras = async () => {
    if (!employee) return;
    setLoadingExtras(true);
    try {
      const [hList, dList] = await Promise.all([
        getEmploymentHistory(employee.id),
        getEmployeeDocuments(employee.id),
      ]);
      setHistories(hList);
      setDocuments(dList);
    } catch (err) {
      console.warn('Gagal memuat histori/dokumen:', err);
    } finally {
      setLoadingExtras(false);
    }
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !newDocData.namaDokumen) return;

    const docItem: EmployeeDocument = {
      id: `doc-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.namaLengkap,
      jenisDokumen: newDocData.jenisDokumen,
      namaDokumen: newDocData.namaDokumen,
      nomorDokumen: newDocData.nomorDokumen,
      tanggalDokumen: newDocData.tanggalDokumen,
      statusVerifikasi: 'TERVERIFIKASI',
      uploadedBy: userProfile?.displayName || userProfile?.email || 'Operator',
      uploadedAt: new Date().toISOString(),
    };

    try {
      await addEmployeeDocument(docItem);
      setShowAddDoc(false);
      setNewDocData({
        jenisDokumen: 'SK_PANGKAT',
        namaDokumen: '',
        nomorDokumen: '',
        tanggalDokumen: new Date().toISOString().split('T')[0],
      });
      await loadExtras();
    } catch (err) {
      console.error('Error adding doc:', err);
    }
  };

  const handleDeleteDoc = async (docId: string, docName: string) => {
    if (!confirm(`Hapus dokumen "${docName}"?`)) return;
    try {
      await deleteEmployeeDocument(docId, docName);
      await loadExtras();
    } catch (err) {
      console.error('Error deleting doc:', err);
    }
  };

  if (!isOpen || !employee) return null;

  const canEdit = userProfile?.role === 'admin' || userProfile?.role === 'operator';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md">
              {employee.namaLengkap.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>{employee.gelarDepan ? `${employee.gelarDepan} ` : ''}{employee.namaLengkap}{employee.gelarBelakang ? `, ${employee.gelarBelakang}` : ''}</span>
                <span className="text-xs px-2 py-0.5 rounded font-normal bg-slate-800 text-amber-400 border border-amber-500/30">
                  {employee.statusKepegawaian}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                NIP: {employee.nip || '-'} • {employee.jabatanUtama}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-6 gap-6">
          <button
            onClick={() => setActiveTab('profil')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'profil'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil Lengkap</span>
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'riwayat'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Perubahan ({histories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('dokumen')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'dokumen'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Arsip Dokumen ({documents.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PROFIL LENGKAP */}
          {activeTab === 'profil' && (
            <div className="space-y-6">
              {/* Highlight Box: TMT di SDN Lanas 1 */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Penempatan Khusus di Sekolah Ini
                    </p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      TMT SDN Lanas 1: {formatTanggalIndonesia(employee.tmtSekolah)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Mulai Bertugas: {formatTanggalIndonesia(employee.tglMulaiTugasLanas1 || employee.tmtSekolah)} • Unit Asal: {employee.unitKerjaAsal || 'SDN Lanas 1'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                      employee.statusAktif === 'AKTIF'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {employee.statusAktif}
                  </span>
                </div>
              </div>

              {/* Grid 2 Kolom Informasi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bagian Identitas */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-500" />
                    Identitas Pribadi
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500">Tempat, Tanggal Lahir</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.tempatLahir}, {formatTanggalIndonesia(employee.tanggalLahir)} (Usia {hitungUsia(employee.tanggalLahir)} Thn)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500">Jenis Kelamin</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500">No. Telepon</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.noTelepon || '-'}
                      </span>
                    </div>
                    <div className="py-1">
                      <span className="text-slate-500 block mb-0.5">Alamat</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.alamat || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bagian Kepangkatan & Jabatan */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    Kepangkatan & Jabatan
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500">Pangkat / Golongan</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {employee.statusKepegawaian === 'PNS'
                          ? `${employee.pangkat || '-'} (${employee.golonganRuang || '-'})`
                          : employee.statusKepegawaian === 'PPPK'
                          ? employee.golonganPppk || 'PPPK'
                          : 'Non-ASN'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500">TMT Pangkat</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatTanggalIndonesia(employee.tmtPangkat || employee.tmtSkPppk)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500">Jabatan Utama</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.jabatanUtama}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500">TMT Jabatan</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatTanggalIndonesia(employee.tmtJabatan)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Jabatan Tambahan</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.jabatanTambahan || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bagian Pendidikan */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-amber-500" />
                    Pendidikan Formal
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500">Jenjang</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.jenjangPendidikan}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500">Program Studi</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.programStudi || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500">Institusi</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.institusiPendidikan || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Tahun Lulus</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.tahunLulus || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bagian Masa Kerja */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Masa Kerja
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500">Masa Kerja Golongan (MKG)</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {employee.mkGolonganTahun ?? 0} Tahun {employee.mkGolonganBulan ?? 0} Bulan
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-500">Masa Kerja Keseluruhan</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {employee.mkKeseluruhanTahun ?? 0} Tahun {employee.mkKeseluruhanBulan ?? 0} Bulan
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Dasar Penetapan</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                        {employee.sumberSkMasaKerja || 'SK Terakhir'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RIWAYAT PERUBAHAN */}
          {activeTab === 'riwayat' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Log Audit Perubahan Data Pegawai
                </h4>
                <span className="text-[11px] text-slate-400">
                  Semua perubahan tersimpan permanen dan terpisah dari master data
                </span>
              </div>

              {loadingExtras ? (
                <div className="py-8 text-center text-xs text-slate-400">Memuat riwayat...</div>
              ) : histories.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400">
                  Belum ada catatan riwayat perubahan untuk pegawai ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {histories.map((h) => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {h.tipePerubahan}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatTanggalSingkat(h.timestamp.split('T')[0])} {h.timestamp.split('T')[1]?.substring(0, 5)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="p-2 rounded bg-slate-100 dark:bg-slate-900/60">
                          <span className="text-slate-400 block text-[10px]">Sebelum:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{h.dataSebelum}</span>
                        </div>
                        <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                          <span className="text-emerald-600 dark:text-emerald-400 block text-[10px]">Sesudah:</span>
                          <span className="font-semibold">{h.dataSesudah}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                        Alasan: "{h.alasanPerubahan}" • Oleh: {h.diubahOleh}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOKUMEN KEPEGAWAIAN */}
          {activeTab === 'dokumen' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Berkas & Metadata Dokumen Resmi
                </h4>
                {canEdit && (
                  <button
                    onClick={() => setShowAddDoc(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-600 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Rekam Dokumen</span>
                  </button>
                )}
              </div>

              {showAddDoc && (
                <form
                  onSubmit={handleSaveDoc}
                  className="p-4 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-3"
                >
                  <h5 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Tambah Arsip Dokumen Baru
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Jenis Dokumen
                      </label>
                      <select
                        value={newDocData.jenisDokumen}
                        onChange={(e) =>
                          setNewDocData({ ...newDocData, jenisDokumen: e.target.value as JenisDokumen })
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="SK_PENGANGKATAN">SK Pengangkatan Awal</option>
                        <option value="SK_PANGKAT">SK Kenaikan Pangkat</option>
                        <option value="SK_JABATAN">SK Jabatan / Tugas Tambahan</option>
                        <option value="SK_PENEMPATAN_MUTASI">SK Penempatan / Mutasi</option>
                        <option value="IJAZAH">Ijazah & Transkrip Nilai</option>
                        <option value="DOKUMEN_MASA_KERJA">Dokumen Penetapan Masa Kerja</option>
                        <option value="PERJANJIAN_KERJA_PPPK">Surat Perjanjian Kerja PPPK</option>
                        <option value="LAINNYA">Dokumen Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nama / Judul Dokumen
                      </label>
                      <input
                        type="text"
                        required
                        value={newDocData.namaDokumen}
                        onChange={(e) => setNewDocData({ ...newDocData, namaDokumen: e.target.value })}
                        placeholder="Contoh: SK Kenaikan Pangkat Pembina IV/a"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nomor Dokumen
                      </label>
                      <input
                        type="text"
                        value={newDocData.nomorDokumen}
                        onChange={(e) => setNewDocData({ ...newDocData, nomorDokumen: e.target.value })}
                        placeholder="823.4/1420/430.10.1/2019"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Tanggal Dokumen
                      </label>
                      <input
                        type="date"
                        value={newDocData.tanggalDokumen}
                        onChange={(e) => setNewDocData({ ...newDocData, tanggalDokumen: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddDoc(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-600"
                    >
                      Simpan Dokumen
                    </button>
                  </div>
                </form>
              )}

              {loadingExtras ? (
                <div className="py-8 text-center text-xs text-slate-400">Memuat berkas dokumen...</div>
              ) : documents.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400">
                  Belum ada berkas dokumen kepegawaian yang diunggah.
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{d.namaDokumen}</p>
                          <p className="text-[11px] text-slate-500">
                            {d.jenisDokumen.replace(/_/g, ' ')} • No: {d.nomorDokumen || '-'} • Tgl: {formatTanggalSingkat(d.tanggalDokumen)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {d.statusVerifikasi}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteDoc(d.id, d.namaDokumen)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500">
            Terdaftar di SI-DUK SMART: {formatTanggalSingkat(employee.createdAt.split('T')[0])}
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onArchive(employee);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Arsipkan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(employee);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold hover:opacity-90 transition shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Ubah Data</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
