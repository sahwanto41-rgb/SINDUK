import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Database,
  Save,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  Shield,
  Image as ImageIcon,
  Trash2,
  UploadCloud,
  FileText,
  Eye,
} from 'lucide-react';
import { AppSettings, Employee, DukPeriod, EmploymentHistory } from '../types';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { compressKopImage } from '../utils/imageCompressor';

interface PengaturanViewProps {
  settings: AppSettings | null;
  employees: Employee[];
  periods: DukPeriod[];
  histories: EmploymentHistory[];
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onRestoreBackup: (data: {
    employees: Employee[];
    settings?: AppSettings;
    periods?: DukPeriod[];
  }) => Promise<void>;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  settings,
  employees,
  periods,
  histories,
  onSaveSettings,
  onRestoreBackup,
}) => {
  const { userProfile, connectionStatus, connectionMessage, checkConnectionNow } = useAuth();

  const [formData, setFormData] = useState<AppSettings>({
    namaSekolah: 'UPTD SPF SD Negeri Lanas 1',
    npsn: '20521884',
    kecamatan: 'Botolinggo',
    kabupaten: 'Bondowoso',
    provinsi: 'Jawa Timur',
    alamatLengkap: 'Desa Lanas, Kec. Botolinggo, Kabupaten Bondowoso, Jawa Timur',
    kodePos: '68284',
    namaKepalaSekolah: 'Sahwanto, S.Pd.',
    nipKepalaSekolah: '19680512 199303 1 008',
    pangkatKepalaSekolah: 'Pembina, IV/a',
    kopSuratUrl: '',
    tipeKopSurat: 'teks',
    kopPemerintah: 'PEMERINTAH KABUPATEN BONDOWOSO',
    kopDinas: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
    kopSekolah: 'UPTD SPF SD NEGERI LANAS 1',
    kopAlamat: 'Desa Lanas, Kec. Botolinggo, Kabupaten Bondowoso, Jawa Timur',
    kopKontak: 'Kode Pos 68284 • Email: sdnlanas1@gmail.com',
    dukOrderConfig: {
      prioritasGolongan: true,
      prioritasTmtPangkat: true,
      prioritasJabatan: true,
      prioritasMasaKerja: true,
      prioritasPendidikan: true,
      prioritasUsia: true,
    },
    updatedAt: new Date().toISOString(),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [isUploadingKop, setIsUploadingKop] = useState(false);
  const [kopUploadError, setKopUploadError] = useState<string | null>(null);
  const kopFileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleKopFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingKop(true);
    setKopUploadError(null);
    try {
      const dataUrl = await compressKopImage(file);
      setFormData((prev) => ({
        ...prev,
        kopSuratUrl: dataUrl,
        tipeKopSurat: 'gambar',
      }));
    } catch (err: any) {
      setKopUploadError(err.message || 'Gagal memproses gambar KOP surat');
    } finally {
      setIsUploadingKop(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveKopImage = () => {
    setFormData((prev) => ({
      ...prev,
      kopSuratUrl: '',
      tipeKopSurat: 'teks',
    }));
  };

  const handleOrderConfigChange = (key: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      dukOrderConfig: {
        ...(prev.dukOrderConfig || {
          prioritasGolongan: true,
          prioritasTmtPangkat: true,
          prioritasJabatan: true,
          prioritasMasaKerja: true,
          prioritasPendidikan: true,
          prioritasUsia: true,
        }),
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessNotice(false);
    try {
      await onSaveSettings(formData);
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 3000);
    } catch (err: any) {
      alert(`Gagal menyimpan pengaturan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      institution: formData.namaSekolah,
      appSettings: formData,
      employees,
      periods,
      histories,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_DUK_SMART_SDN_Lanas_1_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.employees || !Array.isArray(parsed.employees)) {
          throw new Error('Format berkas cadangan JSON tidak valid.');
        }

        if (
          confirm(
            `Pulihkan ${parsed.employees.length} data pegawai dari cadangan tanggal ${parsed.timestamp || 'arsip'}?`
          )
        ) {
          await onRestoreBackup({
            employees: parsed.employees,
            settings: parsed.appSettings,
            periods: parsed.periods,
          });
          alert('Pemulihan data berhasil diselesaikan.');
        }
      } catch (err: any) {
        alert(`Gagal memulihkan cadangan: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <span>Pengaturan Aplikasi & Konfigurasi Instansi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola profil resmi sekolah, data penandatangan, algoritma DUK, dan pencadangan database
          </p>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Pengaturan instansi dan konfigurasi DUK berhasil disimpan secara permanen ke Cloud Firestore.</span>
        </div>
      )}

      {/* Grid: Settings Form & Backup/Connection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Identitas Sekolah */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Identitas Resmi Instansi Sekolah</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nama Satuan Pendidikan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaSekolah}
                  onChange={(e) => handleChange('namaSekolah', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  NPSN (Nomor Pokok Sekolah Nasional)
                </label>
                <input
                  type="text"
                  value={formData.npsn}
                  onChange={(e) => handleChange('npsn', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={formData.kecamatan}
                  onChange={(e) => handleChange('kecamatan', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Kabupaten
                </label>
                <input
                  type="text"
                  value={formData.kabupaten}
                  onChange={(e) => handleChange('kabupaten', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Alamat Lengkap Sekolah (Tercantum pada Kop Dokumen)
                </label>
                <input
                  type="text"
                  value={formData.alamatLengkap}
                  onChange={(e) => handleChange('alamatLengkap', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* KOP SURAT DOKUMEN CETAK RESMI */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>KOP Surat Dokumen Cetak Resmi (Cetak, PDF, & HTML)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesuaikan kop surat yang tercetak pada lembar DUK agar sesuai dengan naskah dinas resmi sekolah
                </p>
              </div>

              {/* Tipe Kop Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => handleChange('tipeKopSurat', 'gambar')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                    formData.tipeKopSurat === 'gambar' || (!formData.tipeKopSurat && formData.kopSuratUrl)
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Gambar KOP Resmi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('tipeKopSurat', 'teks')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                    formData.tipeKopSurat === 'teks' && !formData.kopSuratUrl
                      ? 'bg-slate-900 dark:bg-slate-700 text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Format Teks Terstandar</span>
                </button>
              </div>
            </div>

            {/* Input File Tersembunyi */}
            <input
              ref={kopFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleKopFileChange}
            />

            {/* Area Opsi 1: Gambar KOP Surat */}
            {(formData.tipeKopSurat === 'gambar' || formData.kopSuratUrl) && (
              <div className="space-y-3">
                {formData.kopSuratUrl ? (
                  <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Gambar KOP Surat Aktif Digunakan
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => kopFileInputRef.current?.click()}
                          disabled={isUploadingKop}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-800 dark:text-slate-200 transition"
                        >
                          {isUploadingKop ? 'Memproses...' : 'Ganti Gambar KOP'}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveKopImage}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-100 transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                    {/* Pratinjau Kertas KOP */}
                    <div className="p-3 bg-white rounded-lg border border-slate-300 shadow-inner overflow-hidden">
                      <p className="text-[10px] text-slate-400 font-mono mb-1.5">Pratinjau KOP Surat pada Halaman Cetak:</p>
                      <img
                        src={formData.kopSuratUrl}
                        alt="Pratinjau KOP Surat Resmi"
                        className="w-full h-auto max-h-36 object-contain mx-auto"
                      />
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Gambar ini akan otomatis dicetak di bagian paling atas lembar dokumen DUK (Cetak Langsung, PDF, dan unduhan HTML mandiri).
                    </p>
                  </div>
                ) : (
                  <div
                    onClick={() => kopFileInputRef.current?.click()}
                    className="p-6 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-50/80 cursor-pointer transition text-center space-y-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {isUploadingKop ? 'Sedang Memproses Gambar...' : 'Klik di Sini untuk Mengunggah Berkas Gambar KOP Surat'}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Unggah hasil scan atau berkas gambar resmi KOP sekolah Anda (PNG, JPG, atau WEBP). Sistem otomatis mengoptimasi ukuran berkas agar tajam dan hemat penyimpanan.
                    </p>
                  </div>
                )}

                {kopUploadError && (
                  <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{kopUploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Area Opsi 2: Kustomisasi Format Teks Terstandar */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Susunan Baris Teks KOP Surat (Dapat Diedit):
                </span>
                {formData.kopSuratUrl && formData.tipeKopSurat === 'gambar' && (
                  <span className="text-[11px] text-slate-400">
                    (Disimpan sebagai data cadangan jika gambar KOP tidak digunakan)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Baris 1: Pemerintah Daerah / Induk Instansi
                  </label>
                  <input
                    type="text"
                    value={formData.kopPemerintah || 'PEMERINTAH KABUPATEN BONDOWOSO'}
                    onChange={(e) => handleChange('kopPemerintah', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-semibold"
                    placeholder="PEMERINTAH KABUPATEN BONDOWOSO"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Baris 2: Dinas Pembina / Pengampu
                  </label>
                  <input
                    type="text"
                    value={formData.kopDinas || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
                    onChange={(e) => handleChange('kopDinas', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-semibold"
                    placeholder="DINAS PENDIDIKAN DAN KEBUDAYAAN"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Baris 3: Nama Satuan Pendidikan Resmi
                  </label>
                  <input
                    type="text"
                    value={formData.kopSekolah || formData.namaSekolah}
                    onChange={(e) => handleChange('kopSekolah', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold"
                    placeholder="UPTD SPF SD NEGERI LANAS 1"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Baris 4: Alamat Lengkap Instansi
                  </label>
                  <input
                    type="text"
                    value={formData.kopAlamat || formData.alamatLengkap}
                    onChange={(e) => handleChange('kopAlamat', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Desa Lanas, Kec. Botolinggo, Kabupaten Bondowoso, Jawa Timur"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Baris 5: Kontak, Email, Website, & Kode Pos
                  </label>
                  <input
                    type="text"
                    value={formData.kopKontak || `Kode Pos ${formData.kodePos || '68284'} • Email: sdnlanas1@gmail.com`}
                    onChange={(e) => handleChange('kopKontak', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Kode Pos 68284 • Email: sdnlanas1@gmail.com"
                  />
                </div>
              </div>

              {/* Pratinjau Kop Teks */}
              {(!formData.kopSuratUrl || formData.tipeKopSurat === 'teks') && (
                <div className="mt-3 p-4 bg-white rounded-xl border border-slate-300 shadow-inner text-center">
                  <p className="text-[10px] text-slate-400 font-mono text-left mb-2">Pratinjau Format Teks KOP Surat:</p>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {formData.kopPemerintah || 'Pemerintah Kabupaten Bondowoso'}
                  </h4>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                    {formData.kopDinas || 'Dinas Pendidikan dan Kebudayaan'}
                  </h3>
                  <h2 className="text-sm font-black uppercase text-slate-950 mt-0.5">
                    {formData.kopSekolah || formData.namaSekolah || 'UPTD SPF SD NEGERI LANAS 1'}
                  </h2>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {formData.kopAlamat || formData.alamatLengkap} • {formData.kopKontak || `Kode Pos ${formData.kodePos || '68284'}`}
                  </p>
                  <div className="border-b-2 border-black mt-2"></div>
                  <div className="border-b border-black mt-0.5"></div>
                </div>
              )}
            </div>
          </div>

          {/* Pejabat Pengesah / Kepala Sekolah */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-amber-500" />
              <span>Identitas Kepala Sekolah (Pejabat Penandatangan DUK)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nama Kepala Sekolah & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaKepalaSekolah}
                  onChange={(e) => handleChange('namaKepalaSekolah', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={formData.nipKepalaSekolah}
                  onChange={(e) => handleChange('nipKepalaSekolah', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Pangkat & Golongan Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={formData.pangkatKepalaSekolah}
                  onChange={(e) => handleChange('pangkatKepalaSekolah', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Opsi Visibilitas Penanggung Jawab di Tampilan */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.tampilkanPenanggungJawabHeader || false}
                  onChange={(e) => handleChange('tampilkanPenanggungJawabHeader', e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                    Tampilkan Penanggung Jawab Instansi di Bilah Header & Dashboard Utama
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Saat dinonaktifkan (default), nama & NIP Kepala Sekolah disembunyikan dari bilah atas/banner aplikasi demi kerapian visual, dan hanya digunakan khusus pada lembar pengesahan resmi (Cetak DUK, PDF, Excel, & HTML).
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Konfigurasi Kriteria Pengurutan DUK */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>Konfigurasi Hirarki Aturan Pengurutan DUK PNS</span>
            </h3>

            <p className="text-xs text-slate-500">
              Kriteria hierarki resmi Peraturan Pemerintah No. 15 Tahun 1979 jo. Ketentuan BKN:
            </p>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dukOrderConfig?.prioritasGolongan ?? true}
                  onChange={(e) => handleOrderConfigChange('prioritasGolongan', e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Prioritas 1: Pangkat / Golongan Ruang (Tertinggi ke terendah)
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dukOrderConfig?.prioritasTmtPangkat ?? true}
                  onChange={(e) => handleOrderConfigChange('prioritasTmtPangkat', e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Prioritas 2: TMT Pangkat (Terlama / tanggal lebih awal diutamakan)
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dukOrderConfig?.prioritasJabatan ?? true}
                  onChange={(e) => handleOrderConfigChange('prioritasJabatan', e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Prioritas 3: Jabatan / Eselon & TMT Jabatan
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dukOrderConfig?.prioritasMasaKerja ?? true}
                  onChange={(e) => handleOrderConfigChange('prioritasMasaKerja', e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Prioritas 4: Masa Kerja Golongan (Total bulan terbanyak)
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dukOrderConfig?.prioritasPendidikan ?? true}
                  onChange={(e) => handleOrderConfigChange('prioritasPendidikan', e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Prioritas 5: Jenjang Pendidikan & Tahun Kelulusan
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dukOrderConfig?.prioritasUsia ?? true}
                  onChange={(e) => handleOrderConfigChange('prioritasUsia', e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Prioritas 6: Usia (PNS yang lahir lebih awal / usia lebih tua diutamakan)
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90 shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}</span>
            </button>
          </div>
        </form>

        {/* Right 1 Col: Status & Backup */}
        <div className="space-y-6">
          {/* Status Koneksi Database */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Status Cloud Firestore</span>
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {connectionStatus === 'connected' ? '✓ Terhubung' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Database ID:</span>
                <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  ai-studio-duksmart...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Koleksi:</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  employees, dukPeriods, users
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={checkConnectionNow}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Uji Ulang Koneksi</span>
            </button>
          </div>

          {/* PWA Desktop & Mobile Installation */}
          <PWAInstallButton variant="settings" />

          {/* Backup & Restore Data */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-500" />
              <span>Cadangan & Pemulihan (JSON)</span>
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Unduh cadangan data master, riwayat, dan periode DUK dalam format JSON untuk arsip mandiri atau pemulihan darurat.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:opacity-90 transition shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Cadangan JSON ({employees.length} Pegawai)</span>
              </button>

              <label className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition">
                <Upload className="w-4 h-4 text-amber-500" />
                <span>Pulihkan dari Berkas JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
