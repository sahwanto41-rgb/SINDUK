import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, CheckCircle2, Trash2, User, Calendar } from 'lucide-react';
import { Employee, EmployeeDocument, JenisDokumen } from '../types';
import { formatTanggalSingkat } from '../utils/dukRanking';
import { useAuth } from '../context/AuthContext';

interface DokumenKepegawaianViewProps {
  documents: EmployeeDocument[];
  employees: Employee[];
  onAddDoc: (doc: EmployeeDocument) => Promise<void>;
  onDeleteDoc: (id: string, name: string) => Promise<void>;
}

export const DokumenKepegawaianView: React.FC<DokumenKepegawaianViewProps> = ({
  documents,
  employees,
  onAddDoc,
  onDeleteDoc,
}) => {
  const { userProfile } = useAuth();
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [filterPegawai, setFilterPegawai] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);

  // New Doc Form
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [jenisDokumen, setJenisDokumen] = useState<JenisDokumen>('SK_PANGKAT');
  const [namaDokumen, setNamaDokumen] = useState('');
  const [nomorDokumen, setNomorDokumen] = useState('');
  const [tanggalDokumen, setTanggalDokumen] = useState(new Date().toISOString().split('T')[0]);

  const canEdit = userProfile?.role === 'admin' || userProfile?.role === 'operator';

  const filtered = documents.filter((d) => {
    if (filterJenis !== 'ALL' && d.jenisDokumen !== filterJenis) return false;
    if (filterPegawai !== 'ALL' && d.employeeId !== filterPegawai) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.namaDokumen.toLowerCase().includes(q) ||
        d.employeeName.toLowerCase().includes(q) ||
        (d.nomorDokumen || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === selectedEmpId);
    if (!emp || !namaDokumen.trim()) return;

    const newDoc: EmployeeDocument = {
      id: `doc-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.namaLengkap,
      jenisDokumen,
      namaDokumen: namaDokumen.trim(),
      nomorDokumen: nomorDokumen.trim(),
      tanggalDokumen,
      statusVerifikasi: 'TERVERIFIKASI',
      uploadedBy: userProfile?.displayName || userProfile?.email || 'Operator',
      uploadedAt: new Date().toISOString(),
    };

    await onAddDoc(newDoc);
    setShowModal(false);
    setNamaDokumen('');
    setNomorDokumen('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>Dokumen & Arsip Digital Kepegawaian</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Metadata dan berkas arsip SK Pengangkatan, SK Pangkat, Ijazah, Penempatan, dan Kontrak PPPK
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              if (employees.length > 0 && !selectedEmpId) setSelectedEmpId(employees[0].id);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dokumen</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama berkas, SK, atau nama pegawai..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={filterJenis}
          onChange={(e) => setFilterJenis(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
        >
          <option value="ALL">Semua Jenis Dokumen</option>
          <option value="SK_PENGANGKATAN">SK Pengangkatan Awal</option>
          <option value="SK_PANGKAT">SK Kenaikan Pangkat</option>
          <option value="SK_JABATAN">SK Jabatan</option>
          <option value="SK_PENEMPATAN_MUTASI">SK Penempatan / Mutasi</option>
          <option value="IJAZAH">Ijazah & Transkrip</option>
          <option value="DOKUMEN_MASA_KERJA">Dokumen Masa Kerja</option>
          <option value="PERJANJIAN_KERJA_PPPK">Perjanjian Kerja PPPK</option>
        </select>

        <select
          value={filterPegawai}
          onChange={(e) => setFilterPegawai(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
        >
          <option value="ALL">Semua Pegawai ({employees.length})</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.namaLengkap} ({emp.nip || 'Non-NIP'})
            </option>
          ))}
        </select>
      </div>

      {/* Document Grid / Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Belum ada berkas dokumen yang tersimpan pada kategori ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-900 text-white dark:bg-slate-950 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Dokumen & Nomor SK</th>
                  <th className="py-3 px-4">Jenis Dokumen</th>
                  <th className="py-3 px-4">Pegawai Terkait</th>
                  <th className="py-3 px-3 text-center">Tanggal Dokumen</th>
                  <th className="py-3 px-3 text-center">Verifikasi</th>
                  <th className="py-3 px-4">Diupload Oleh</th>
                  {canEdit && <th className="py-3 px-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{doc.namaDokumen}</p>
                      <p className="text-[11px] text-slate-500 font-mono">No: {doc.nomorDokumen || '-'}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                        {doc.jenisDokumen.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {doc.employeeName}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-[11px]">
                      {formatTanggalSingkat(doc.tanggalDokumen)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{doc.statusVerifikasi}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {doc.uploadedBy}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onDeleteDoc(doc.id, doc.namaDokumen)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Hapus Dokumen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tambah Berkas Metadata Dokumen
            </h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Pilih Pegawai <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.namaLengkap} ({emp.statusKepegawaian} - {emp.nip || 'Non-NIP'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Jenis Dokumen
                </label>
                <select
                  value={jenisDokumen}
                  onChange={(e) => setJenisDokumen(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="SK_PENGANGKATAN">SK Pengangkatan Awal</option>
                  <option value="SK_PANGKAT">SK Kenaikan Pangkat</option>
                  <option value="SK_JABATAN">SK Jabatan / Tugas Tambahan</option>
                  <option value="SK_PENEMPATAN_MUTASI">SK Penempatan / Mutasi</option>
                  <option value="IJAZAH">Ijazah & Transkrip Nilai</option>
                  <option value="DOKUMEN_MASA_KERJA">Dokumen Masa Kerja</option>
                  <option value="PERJANJIAN_KERJA_PPPK">Perjanjian Kerja PPPK</option>
                  <option value="LAINNYA">Dokumen Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nama / Judul Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaDokumen}
                  onChange={(e) => setNamaDokumen(e.target.value)}
                  placeholder="Contoh: SK Kenaikan Pangkat Pembina IV/a Tahun 2021"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Nomor Dokumen
                  </label>
                  <input
                    type="text"
                    value={nomorDokumen}
                    onChange={(e) => setNomorDokumen(e.target.value)}
                    placeholder="823.4/1420/430.10.1/2021"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tanggal Dokumen
                  </label>
                  <input
                    type="date"
                    value={tanggalDokumen}
                    onChange={(e) => setTanggalDokumen(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-bold bg-amber-500 text-slate-950 hover:bg-amber-600"
                >
                  Simpan Metadata Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
