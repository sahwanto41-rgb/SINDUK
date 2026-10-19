import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  BadgeCheck,
  Award,
  Briefcase,
  MapPin,
  GraduationCap,
  Clock,
  Save,
  AlertCircle,
  Calculator,
} from 'lucide-react';
import { Employee, StatusKepegawaian, JenisPTK, JenisKelamin, StatusAktif } from '../types';
import { PANGKAT_PNS_LIST, hitungMasaKerjaOtomatis, checkEmployeeDataCompleteness } from '../utils/dukRanking';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (emp: Employee, alasanPerubahan: string) => Promise<void>;
  initialData?: Employee | null;
  existingEmployees: Employee[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingEmployees,
}) => {
  const [activeTab, setActiveTab] = useState<
    'identitas' | 'status' | 'kepangkatan' | 'jabatan' | 'penempatan' | 'pendidikan' | 'masakerja'
  >('identitas');

  // Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
    statusKepegawaian: 'PNS',
    jenisPtk: 'GURU',
    jenisKelamin: 'L',
    statusAktif: 'AKTIF',
    tmtSekolah: new Date().toISOString().split('T')[0],
    tglMulaiTugasLanas1: new Date().toISOString().split('T')[0],
    mkGolonganTahun: 0,
    mkGolonganBulan: 0,
    mkKeseluruhanTahun: 0,
    mkKeseluruhanBulan: 0,
    isDataLengkap: false,
  });

  const [alasanPerubahan, setAlasanPerubahan] = useState('Pembaruan data berkala');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
      setAlasanPerubahan('Penyesuaian data kepegawaian');
    } else {
      setFormData({
        id: `emp-${Date.now()}`,
        statusKepegawaian: 'PNS',
        jenisPtk: 'GURU',
        jenisKelamin: 'L',
        statusAktif: 'AKTIF',
        tempatLahir: 'Bondowoso',
        tanggalLahir: '1985-01-01',
        tmtSekolah: '2020-01-01',
        tglMulaiTugasLanas1: '2020-01-01',
        mkGolonganTahun: 0,
        mkGolonganBulan: 0,
        mkKeseluruhanTahun: 0,
        mkKeseluruhanBulan: 0,
        jenjangPendidikan: 'S-1',
        isDataLengkap: false,
      });
      setAlasanPerubahan('Perekaman pegawai baru');
    }
    setActiveTab('identitas');
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Employee, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Sinkronisasi otomatis pangkat dari golongan ruang PNS
      if (field === 'golonganRuang' && updated.statusKepegawaian === 'PNS') {
        const found = PANGKAT_PNS_LIST.find((p) => p.gol === value);
        if (found) {
          updated.pangkat = found.pangkat;
        }
      }

      return updated;
    });
  };

  const handleHitungOtomatisMasaKerja = () => {
    const refDate = formData.tglAcuanMasaKerja || new Date().toISOString().split('T')[0];

    // Hitung MK Golongan dari TMT Pangkat (jika ada)
    if (formData.tmtPangkat) {
      const mkg = hitungMasaKerjaOtomatis(formData.tmtPangkat, refDate);
      handleChange('mkGolonganTahun', mkg.tahun);
      handleChange('mkGolonganBulan', mkg.bulan);
    }

    // Hitung MK Keseluruhan dari TMT di sekolah atau TMT awal
    const startOverall = formData.tmtPangkat || formData.tmtSekolah;
    if (startOverall) {
      const mkt = hitungMasaKerjaOtomatis(startOverall, refDate);
      handleChange('mkKeseluruhanTahun', mkt.tahun);
      handleChange('mkKeseluruhanBulan', mkt.bulan);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validasi
    if (!formData.namaLengkap?.trim()) {
      setErrorMsg('Nama Lengkap wajib diisi');
      setActiveTab('identitas');
      return;
    }

    if (!formData.tmtSekolah) {
      setErrorMsg('TMT di SD Negeri Lanas 1 wajib diisi secara terpisah');
      setActiveTab('penempatan');
      return;
    }

    // Cek duplikasi NIP
    if (formData.nip && formData.nip.trim() !== '-') {
      const nipClean = formData.nip.trim();
      const duplicate = existingEmployees.find(
        (emp) => emp.id !== formData.id && emp.nip?.trim() === nipClean
      );
      if (duplicate) {
        setErrorMsg(`NIP "${nipClean}" sudah digunakan oleh pegawai lain: ${duplicate.namaLengkap}`);
        setActiveTab('identitas');
        return;
      }
    }

    // Evaluasi kelengkapan data
    const completeness = checkEmployeeDataCompleteness(formData);

    const finalEmployee: Employee = {
      ...(formData as Employee),
      id: formData.id || `emp-${Date.now()}`,
      nip: formData.nip?.trim() || '-',
      namaLengkap: formData.namaLengkap.trim(),
      isDataLengkap: completeness.isLengkap,
      missingFields: completeness.missing,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      setIsSaving(true);
      await onSave(finalEmployee, alasanPerubahan);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data pegawai');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'identitas', label: '1. Identitas', icon: User },
    { id: 'status', label: '2. Status & PTK', icon: BadgeCheck },
    { id: 'kepangkatan', label: '3. Kepangkatan', icon: Award },
    { id: 'jabatan', label: '4. Jabatan', icon: Briefcase },
    { id: 'penempatan', label: '5. Penempatan (TMT Sekolah)', icon: MapPin },
    { id: 'pendidikan', label: '6. Pendidikan', icon: GraduationCap },
    { id: 'masakerja', label: '7. Masa Kerja', icon: Clock },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div>
            <h2 className="text-base lg:text-lg font-bold">
              {initialData ? 'Ubah Data Pegawai' : 'Perekaman Pegawai Baru'}
            </h2>
            <p className="text-xs text-amber-400">
              UPTD SPF SD Negeri Lanas 1 • Kec. Botolinggo, Kab. Bondowoso
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 overflow-x-auto scrollbar-none">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isCur = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                  isCur
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: IDENTITAS */}
          {activeTab === 'identitas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap (tanpa gelar) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaLengkap || ''}
                    onChange={(e) => handleChange('namaLengkap', e.target.value)}
                    placeholder="Contoh: Sahwanto"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIP (18 Digit untuk ASN) / NUPTK
                  </label>
                  <input
                    type="text"
                    value={formData.nip || ''}
                    onChange={(e) => handleChange('nip', e.target.value)}
                    placeholder="Contoh: 196805121993031008 (atau '-' jika Non-ASN)"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gelar Depan
                  </label>
                  <input
                    type="text"
                    value={formData.gelarDepan || ''}
                    onChange={(e) => handleChange('gelarDepan', e.target.value)}
                    placeholder="Contoh: Drs. / Dra."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gelar Belakang
                  </label>
                  <input
                    type="text"
                    value={formData.gelarBelakang || ''}
                    onChange={(e) => handleChange('gelarBelakang', e.target.value)}
                    placeholder="Contoh: S.Pd. / M.Pd."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={formData.tempatLahir || ''}
                    onChange={(e) => handleChange('tempatLahir', e.target.value)}
                    placeholder="Bondowoso"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalLahir || ''}
                    onChange={(e) => handleChange('tanggalLahir', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.jenisKelamin || 'L'}
                    onChange={(e) => handleChange('jenisKelamin', e.target.value as JenisKelamin)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.noTelepon || ''}
                    onChange={(e) => handleChange('noTelepon', e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={formData.statusAktif || 'AKTIF'}
                    onChange={(e) => handleChange('statusAktif', e.target.value as StatusAktif)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="AKTIF">Aktif Bertugas</option>
                    <option value="MUTASI_KELUAR">Mutasi Keluar</option>
                    <option value="PENSIUN">Pensiun</option>
                    <option value="CUTI">Cuti Resmi</option>
                    <option value="TIDAK_AKTIF">Tidak Aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  value={formData.alamat || ''}
                  onChange={(e) => handleChange('alamat', e.target.value)}
                  placeholder="Dusun / Desa, RT/RW, Kecamatan, Kabupaten..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* TAB 2: STATUS KEPEGAWAIAN */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Kepegawaian <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.statusKepegawaian || 'PNS'}
                    onChange={(e) => handleChange('statusKepegawaian', e.target.value as StatusKepegawaian)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-amber-600 dark:text-amber-400"
                  >
                    <option value="PNS">Pegawai Negeri Sipil (PNS)</option>
                    <option value="PPPK">Pegawai Pemerintah dengan Perjanjian Kerja (PPPK)</option>
                    <option value="NON_ASN">Non-ASN / Honorer / Sukwan</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    *PNS memiliki nomor urut DUK formal. PPPK dan Non-ASN dikelompokkan dalam rekapitulasi register terpisah.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis PTK (Pendidik / Tenaga Kependidikan)
                  </label>
                  <select
                    value={formData.jenisPtk || 'GURU'}
                    onChange={(e) => handleChange('jenisPtk', e.target.value as JenisPTK)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="GURU">Guru / Pendidik</option>
                    <option value="TENAGA_KEPENDIDIKAN">Tenaga Kependidikan (TU, Operator, Penjaga)</option>
                  </select>
                </div>
              </div>

              {formData.statusKepegawaian === 'PPPK' && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-3">
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                    Atribut Khusus PPPK
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Golongan PPPK
                      </label>
                      <select
                        value={formData.golonganPppk || 'Golongan IX'}
                        onChange={(e) => handleChange('golonganPppk', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Golongan IX">Golongan IX (S-1 / D-IV)</option>
                        <option value="Golongan X">Golongan X (S-2)</option>
                        <option value="Golongan VII">Golongan VII (D-III)</option>
                        <option value="Golongan V">Golongan V (SLTA)</option>
                        <option value="Golongan I">Golongan I (SD)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        TMT SK PPPK
                      </label>
                      <input
                        type="date"
                        value={formData.tmtSkPppk || ''}
                        onChange={(e) => handleChange('tmtSkPppk', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nomor Perjanjian Kerja
                      </label>
                      <input
                        type="text"
                        value={formData.noPerjanjianKerjaPppk || ''}
                        onChange={(e) => handleChange('noPerjanjianKerjaPppk', e.target.value)}
                        placeholder="810/342/PPPK/2022"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KEPANGKATAN */}
          {activeTab === 'kepangkatan' && (
            <div className="space-y-4">
              {formData.statusKepegawaian !== 'PNS' ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-semibold">Perhatian:</p>
                  <p>
                    Pegawai berstatus <strong>{formData.statusKepegawaian}</strong> tidak memiliki pangkat/golongan ruang PNS. Silakan lewati tab ini atau sesuaikan data pada tab Status/Jabatan.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Golongan Ruang PNS <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.golonganRuang || 'IV/a'}
                        onChange={(e) => handleChange('golonganRuang', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      >
                        {PANGKAT_PNS_LIST.map((p) => (
                          <option key={p.gol} value={p.gol}>
                            {p.gol} — {p.pangkat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Pangkat
                      </label>
                      <input
                        type="text"
                        value={formData.pangkat || ''}
                        onChange={(e) => handleChange('pangkat', e.target.value)}
                        placeholder="Contoh: Pembina / Penata Tk. I"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        TMT Pangkat Terakhir <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.tmtPangkat || ''}
                        onChange={(e) => handleChange('tmtPangkat', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nomor SK Pangkat
                      </label>
                      <input
                        type="text"
                        value={formData.noSkPangkat || ''}
                        onChange={(e) => handleChange('noSkPangkat', e.target.value)}
                        placeholder="823.4/1420/430.10.1/2019"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Tanggal SK Pangkat
                      </label>
                      <input
                        type="date"
                        value={formData.tglSkPangkat || ''}
                        onChange={(e) => handleChange('tglSkPangkat', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Instansi Penerbit SK
                      </label>
                      <input
                        type="text"
                        value={formData.instansiSkPangkat || 'Bupati Bondowoso'}
                        onChange={(e) => handleChange('instansiSkPangkat', e.target.value)}
                        placeholder="Bupati Bondowoso / BKN"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: JABATAN */}
          {activeTab === 'jabatan' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan Utama <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.jabatanUtama || ''}
                    onChange={(e) => handleChange('jabatanUtama', e.target.value)}
                    placeholder="Contoh: Kepala Sekolah / Guru Kelas Ahli Madya / Guru PJOK"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan Tambahan
                  </label>
                  <input
                    type="text"
                    value={formData.jabatanTambahan || ''}
                    onChange={(e) => handleChange('jabatanTambahan', e.target.value)}
                    placeholder="Contoh: Bendahara BOS / Pengelola Perpustakaan"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Jabatan
                  </label>
                  <select
                    value={formData.jenisJabatan || 'Fungsional Guru'}
                    onChange={(e) => handleChange('jenisJabatan', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Fungsional Guru Diberi Tugas Tambahan">Fungsional Guru Diberi Tugas Tambahan (Kepala Sekolah)</option>
                    <option value="Fungsional Guru">Fungsional Guru</option>
                    <option value="Fungsional Guru PPPK">Fungsional Guru PPPK</option>
                    <option value="Pelaksana">Pelaksana / Administrasi</option>
                    <option value="Tenaga Teknis">Tenaga Teknis / Kebersihan / Keamanan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    TMT Jabatan
                  </label>
                  <input
                    type="date"
                    value={formData.tmtJabatan || ''}
                    onChange={(e) => handleChange('tmtJabatan', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor SK Jabatan
                  </label>
                  <input
                    type="text"
                    value={formData.noSkJabatan || ''}
                    onChange={(e) => handleChange('noSkJabatan', e.target.value)}
                    placeholder="821.29/215/430.10.1/2020"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PENEMPATAN (WAJIB TMT DI SEKOLAH INI TERPISAH) */}
          {activeTab === 'penempatan' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/60">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                      Ketentuan Khusus Penempatan di UPTD SPF SD Negeri Lanas 1
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                      <strong>TMT di sekolah ini wajib menjadi kolom tersendiri.</strong> Jangan disamakan dengan TMT pangkat, TMT jabatan, atau tanggal mulai menjadi PNS/ASN.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                    TMT di SD Negeri Lanas 1 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tmtSekolah || ''}
                    onChange={(e) => handleChange('tmtSekolah', e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold rounded-lg border-2 border-amber-500 dark:border-amber-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Terhitung Mulai Tanggal resmi penempatan di SDN Lanas 1
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Mulai Bertugas Fisik di SDN Lanas 1
                  </label>
                  <input
                    type="date"
                    value={formData.tglMulaiTugasLanas1 || ''}
                    onChange={(e) => handleChange('tglMulaiTugasLanas1', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Kerja Asal (Bila Mutasi Masuk)
                  </label>
                  <input
                    type="text"
                    value={formData.unitKerjaAsal || ''}
                    onChange={(e) => handleChange('unitKerjaAsal', e.target.value)}
                    placeholder="Contoh: SDN Botolinggo 1"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor SK Penempatan / Mutasi
                  </label>
                  <input
                    type="text"
                    value={formData.noSkPenempatan || ''}
                    onChange={(e) => handleChange('noSkPenempatan', e.target.value)}
                    placeholder="821.29/215/430.10.1/2020"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal SK Penempatan
                  </label>
                  <input
                    type="date"
                    value={formData.tglSkPenempatan || ''}
                    onChange={(e) => handleChange('tglSkPenempatan', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PENDIDIKAN */}
          {activeTab === 'pendidikan' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenjang Pendidikan Terakhir <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.jenjangPendidikan || 'S-1'}
                    onChange={(e) => handleChange('jenjangPendidikan', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="S-3">S-3 (Doktor)</option>
                    <option value="S-2">S-2 (Magister)</option>
                    <option value="S-1">S-1 (Sarjana)</option>
                    <option value="D-IV">D-IV (Diploma IV)</option>
                    <option value="D-III">D-III (Diploma III)</option>
                    <option value="D-II">D-II (Diploma II)</option>
                    <option value="D-I">D-I (Diploma I)</option>
                    <option value="SMA/SMK">SMA / SMK / MA</option>
                    <option value="SMP">SMP / MTs</option>
                    <option value="SD">SD / MI</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Program Studi / Jurusan
                  </label>
                  <input
                    type="text"
                    value={formData.programStudi || ''}
                    onChange={(e) => handleChange('programStudi', e.target.value)}
                    placeholder="Contoh: Pendidikan Guru Sekolah Dasar (PGSD)"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Institusi / Universitas
                  </label>
                  <input
                    type="text"
                    value={formData.institusiPendidikan || ''}
                    onChange={(e) => handleChange('institusiPendidikan', e.target.value)}
                    placeholder="Contoh: Universitas Terbuka Jember / Universitas Jember"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tahun Kelulusan
                  </label>
                  <input
                    type="text"
                    value={formData.tahunLulus || ''}
                    onChange={(e) => handleChange('tahunLulus', e.target.value)}
                    placeholder="Contoh: 2008"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pendidikan & Gelar pada Ijazah
                </label>
                <input
                  type="text"
                  value={formData.pendidikanTerakhir || ''}
                  onChange={(e) => handleChange('pendidikanTerakhir', e.target.value)}
                  placeholder="S-1 Pendidikan Guru Sekolah Dasar"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* TAB 7: MASA KERJA */}
          {activeTab === 'masakerja' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold">Bantuan Perhitungan Otomatis:</span> Gunakan tanggal acuan untuk mengisi masa kerja.
                </div>
                <button
                  type="button"
                  onClick={handleHitungOtomatisMasaKerja}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 transition"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Hitung dari TMT</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                    Masa Kerja Golongan (MKG)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Tahun</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.mkGolonganTahun ?? 0}
                        onChange={(e) => handleChange('mkGolonganTahun', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Bulan</label>
                      <input
                        type="number"
                        min="0"
                        max="11"
                        value={formData.mkGolonganBulan ?? 0}
                        onChange={(e) => handleChange('mkGolonganBulan', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                    Masa Kerja Keseluruhan (Total)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Tahun</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.mkKeseluruhanTahun ?? 0}
                        onChange={(e) => handleChange('mkKeseluruhanTahun', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Bulan</label>
                      <input
                        type="number"
                        min="0"
                        max="11"
                        value={formData.mkKeseluruhanBulan ?? 0}
                        onChange={(e) => handleChange('mkKeseluruhanBulan', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Acuan Perhitungan
                  </label>
                  <input
                    type="date"
                    value={formData.tglAcuanMasaKerja || '2026-01-01'}
                    onChange={(e) => handleChange('tglAcuanMasaKerja', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sumber Dokumen Penetapan Masa Kerja
                  </label>
                  <input
                    type="text"
                    value={formData.sumberSkMasaKerja || ''}
                    onChange={(e) => handleChange('sumberSkMasaKerja', e.target.value)}
                    placeholder="SK Kenaikan Pangkat / SK Penyesuaian Masa Kerja"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Audit Reason Footer Requirement */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Alasan Perubahan / Catatan Audit <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={alasanPerubahan}
              onChange={(e) => setAlasanPerubahan(e.target.value)}
              placeholder="Contoh: Kenaikan pangkat reguler / Rekapitulasi awal tahun 2026"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90 shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan ke Firestore'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
