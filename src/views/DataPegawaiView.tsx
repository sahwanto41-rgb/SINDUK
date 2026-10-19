import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Archive,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  FileSpreadsheet,
  Download,
  Calendar,
} from 'lucide-react';
import { Employee, StatusKepegawaian, StatusAktif } from '../types';
import { formatTanggalSingkat, formatTanggalIndonesia } from '../utils/dukRanking';
import { useAuth } from '../context/AuthContext';

interface DataPegawaiViewProps {
  employees: Employee[];
  onAdd: () => void;
  onEdit: (emp: Employee) => void;
  onDetail: (emp: Employee) => void;
  onArchive: (emp: Employee) => void;
  onDelete: (id: string, nama: string) => Promise<void>;
  onOpenImport: () => void;
}

export const DataPegawaiView: React.FC<DataPegawaiViewProps> = ({
  employees,
  onAdd,
  onEdit,
  onDetail,
  onArchive,
  onDelete,
  onOpenImport,
}) => {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPtk, setFilterPtk] = useState<string>('ALL');
  const [filterKeaktifan, setFilterKeaktifan] = useState<string>('AKTIF');

  const canEdit = userProfile?.role === 'admin' || userProfile?.role === 'operator';
  const isAdmin = userProfile?.role === 'admin';

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Keaktifan
      if (filterKeaktifan !== 'ALL' && emp.statusAktif !== filterKeaktifan) return false;

      // Status Kepegawaian
      if (filterStatus !== 'ALL' && emp.statusKepegawaian !== filterStatus) return false;

      // Jenis PTK
      if (filterPtk !== 'ALL' && emp.jenisPtk !== filterPtk) return false;

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = emp.namaLengkap.toLowerCase().includes(q);
        const matchNip = (emp.nip || '').toLowerCase().includes(q);
        const matchJab = (emp.jabatanUtama || '').toLowerCase().includes(q);
        return matchName || matchNip || matchJab;
      }

      return true;
    });
  }, [employees, filterKeaktifan, filterStatus, filterPtk, searchTerm]);

  const handleDeleteConfirm = async (id: string, nama: string) => {
    if (confirm(`Peringatan: Anda akan menghapus data pegawai "${nama}" secara permanen dari Cloud Firestore. Tindakan ini tidak dapat dibatalkan. Lanjutkan?`)) {
      await onDelete(id, nama);
    }
  };

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Master Data Kepegawaian
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap pendidik & tenaga kependidikan UPTD SPF SD Negeri Lanas 1
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={onOpenImport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Impor Excel</span>
              </button>
              <button
                onClick={onAdd}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pegawai</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NIP, atau jabatan..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Status Kepegawaian Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="ALL">Semua Status Kepegawaian</option>
            <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
            <option value="PPPK">PPPK</option>
            <option value="NON_ASN">Non-ASN / Honorer</option>
          </select>

          {/* Jenis PTK Filter */}
          <select
            value={filterPtk}
            onChange={(e) => setFilterPtk(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="ALL">Semua Jenis PTK</option>
            <option value="GURU">Guru / Pendidik</option>
            <option value="TENAGA_KEPENDIDIKAN">Tenaga Kependidikan</option>
          </select>

          {/* Keaktifan Filter */}
          <select
            value={filterKeaktifan}
            onChange={(e) => setFilterKeaktifan(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="AKTIF">Status: Aktif Bertugas</option>
            <option value="MUTASI_KELUAR">Status: Mutasi Keluar</option>
            <option value="PENSIUN">Status: Pensiun</option>
            <option value="CUTI">Status: Cuti</option>
            <option value="ALL">Semua Status (Termasuk Arsip)</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-900 text-white dark:bg-slate-950 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Pegawai & NIP</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Pangkat / Gol.</th>
                <th className="py-3 px-4">Jabatan Utama</th>
                <th className="py-3 px-3 bg-amber-500/10 text-amber-400">TMT di SDN Lanas 1</th>
                <th className="py-3 px-3">Pendidikan</th>
                <th className="py-3 px-3">Masa Kerja (Gol/Tot)</th>
                <th className="py-3 px-3 text-center">Validasi Data</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada data pegawai yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => {
                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Nama & NIP */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white hover:text-amber-500 cursor-pointer" onClick={() => onDetail(emp)}>
                          {emp.gelarDepan ? `${emp.gelarDepan} ` : ''}
                          {emp.namaLengkap}
                          {emp.gelarBelakang ? `, ${emp.gelarBelakang}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          NIP: {emp.nip || '-'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            emp.statusKepegawaian === 'PNS'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                              : emp.statusKepegawaian === 'PPPK'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                              : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                          }`}
                        >
                          {emp.statusKepegawaian}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {emp.jenisPtk === 'GURU' ? 'Guru' : 'Tendik'}
                        </p>
                      </td>

                      {/* Pangkat / Gol */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-amber-600 dark:text-amber-400">
                          {emp.statusKepegawaian === 'PNS'
                            ? emp.golonganRuang || '-'
                            : emp.statusKepegawaian === 'PPPK'
                            ? emp.golonganPppk || 'PPPK'
                            : '-'}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {emp.pangkat || (emp.statusKepegawaian === 'PPPK' ? 'PPPK' : 'Non-ASN')}
                        </p>
                      </td>

                      {/* Jabatan */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {emp.jabatanUtama}
                        </p>
                        {emp.jabatanTambahan && (
                          <p className="text-[10px] text-slate-400 italic">
                            Tgs: {emp.jabatanTambahan}
                          </p>
                        )}
                      </td>

                      {/* TMT Sekolah (WAJIB TERPISAH) */}
                      <td className="py-3 px-3 bg-amber-500/5 font-mono font-bold text-slate-900 dark:text-white">
                        {formatTanggalSingkat(emp.tmtSekolah)}
                      </td>

                      {/* Pendidikan */}
                      <td className="py-3 px-3">
                        <p className="font-medium">{emp.jenjangPendidikan}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[100px]">
                          {emp.programStudi || emp.pendidikanTerakhir}
                        </p>
                      </td>

                      {/* Masa Kerja */}
                      <td className="py-3 px-3">
                        <p className="text-[11px] font-semibold">
                          G: {emp.mkGolonganTahun ?? 0}T {emp.mkGolonganBulan ?? 0}B
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Tot: {emp.mkKeseluruhanTahun ?? 0}T {emp.mkKeseluruhanBulan ?? 0}B
                        </p>
                      </td>

                      {/* Validasi Kelengkapan */}
                      <td className="py-3 px-3 text-center">
                        {emp.isDataLengkap ? (
                          <span
                            title="Data lengkap dan siap diurutkan dalam DUK"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Lengkap</span>
                          </span>
                        ) : (
                          <span
                            title={`Perlu dilengkapi: ${emp.missingFields?.join(', ')}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-help"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>Kurang Data</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onDetail(emp)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Lihat Detail Profil"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => onEdit(emp)}
                                className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
                                title="Ubah Data Pegawai"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onArchive(emp)}
                                className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                                title="Arsipkan Pegawai (Mutasi/Pensiun)"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteConfirm(emp.id, emp.namaLengkap)}
                              className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                              title="Hapus Permanen (Khusus Administrator)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
          <span>Menampilkan {filteredEmployees.length} dari {employees.length} pegawai</span>
          <span className="font-medium">*TMT di SDN Lanas 1 terpisah dari TMT Pangkat/Jabatan</span>
        </div>
      </div>
    </div>
  );
};
