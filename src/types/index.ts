export type UserRole = 'admin' | 'operator' | 'kepala_sekolah' | 'auditor';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type StatusKepegawaian = 'PNS' | 'PPPK' | 'NON_ASN';
export type JenisPTK = 'GURU' | 'TENAGA_KEPENDIDIKAN';
export type JenisKelamin = 'L' | 'P';
export type StatusAktif = 'AKTIF' | 'MUTASI_KELUAR' | 'PENSIUN' | 'CUTI' | 'TIDAK_AKTIF';

export interface Employee {
  id: string;
  nip: string; // NIP 18 digit untuk PNS / PPPK, atau NUPTK / Kode Identitas
  namaLengkap: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  jenisKelamin: JenisKelamin;
  alamat?: string;
  noTelepon?: string;

  // Status & Kepegawaian
  statusKepegawaian: StatusKepegawaian;
  jenisPtk: JenisPTK;

  // Kepangkatan (Khusus PNS / penyesuaian PPPK)
  pangkat?: string; // misal: Pembina, Penata Tk. I, Penata, Pengatur, dll.
  golonganRuang?: string; // misal: IV/b, IV/a, III/d, III/c, III/b, III/a, dll.
  tmtPangkat?: string; // YYYY-MM-DD
  noSkPangkat?: string;
  tglSkPangkat?: string;
  instansiSkPangkat?: string;

  // Khusus PPPK
  golonganPppk?: string; // misal: Golongan IX, Golongan X, Golongan VII
  tmtSkPppk?: string;
  noPerjanjianKerjaPppk?: string;
  masaKontrakAwal?: string;
  masaKontrakAkhir?: string;

  // Jabatan
  jabatanUtama: string; // misal: Kepala Sekolah, Guru Kelas Ahli Madya, Guru PJOK, Operator Sekolah
  jabatanTambahan?: string; // misal: Plt. Kepala Sekolah, Bendahara BOS, Pengelola Perpustakaan
  jenisJabatan?: string; // Struktural, Fungsional Guru, Pelaksana
  eselon?: string; // Non-Eselon, Eselon IV, dll.
  tmtJabatan?: string; // YYYY-MM-DD
  noSkJabatan?: string;
  tglSkJabatan?: string;

  // Penempatan (WAJIB TERPISAH: TMT di SD Negeri Lanas 1)
  tmtSekolah: string; // YYYY-MM-DD - TMT di UPTD SPF SD Negeri Lanas 1
  tglMulaiTugasLanas1?: string; // Tanggal fisik mulai bertugas di sekolah ini
  unitKerjaAsal?: string; // Unit kerja sebelumnya bila mutasi
  noSkPenempatan?: string;
  tglSkPenempatan?: string;

  // Pendidikan
  pendidikanTerakhir: string; // misal: S-1 Pendidikan Guru Sekolah Dasar
  jenjangPendidikan: 'SD' | 'SMP' | 'SMA/SMK' | 'D-I' | 'D-II' | 'D-III' | 'D-IV' | 'S-1' | 'S-2' | 'S-3';
  programStudi?: string;
  institusiPendidikan?: string;
  tahunLulus?: string;

  // Masa Kerja
  mkGolonganTahun: number;
  mkGolonganBulan: number;
  mkKeseluruhanTahun: number;
  mkKeseluruhanBulan: number;
  tglAcuanMasaKerja?: string;
  sumberSkMasaKerja?: string;
  catatanKoreksiMasaKerja?: string;

  // Kelengkapan & Status
  isDataLengkap: boolean;
  missingFields?: string[];
  statusAktif: StatusAktif;
  keterangan?: string;

  createdAt: string;
  updatedAt: string;
}

export interface DukItem {
  noUrut: number;
  employee: Employee;
  pangkatGolonganText: string;
  tmtPangkatFormatted: string;
  jabatanFormatted: string;
  tmtJabatanFormatted: string;
  tmtSekolahFormatted: string;
  mkGolonganFormatted: string;
  mkKeseluruhanFormatted: string;
  pendidikanFormatted: string;
  ttlFormatted: string;
  usiaTahun: number;
  alasanUrutan: string[];
  isLengkap: boolean;
  missingDataNotes: string[];
}

export type TipePerubahan = 
  | 'PANGKAT' 
  | 'JABATAN' 
  | 'PENEMPATAN' 
  | 'PENDIDIKAN' 
  | 'MASA_KERJA' 
  | 'STATUS' 
  | 'KOREKSI';

export interface EmploymentHistory {
  id: string;
  employeeId: string;
  employeeName: string;
  tipePerubahan: TipePerubahan;
  dataSebelum: string;
  dataSesudah: string;
  alasanPerubahan: string;
  nomorDokumen?: string;
  diubahOleh: string;
  userId?: string;
  timestamp: string;
}

export type JenisDokumen = 
  | 'SK_PENGANGKATAN' 
  | 'SK_PANGKAT' 
  | 'SK_JABATAN' 
  | 'SK_PENEMPATAN_MUTASI' 
  | 'IJAZAH' 
  | 'DOKUMEN_MASA_KERJA' 
  | 'PERJANJIAN_KERJA_PPPK' 
  | 'LAINNYA';

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  jenisDokumen: JenisDokumen;
  namaDokumen: string;
  nomorDokumen?: string;
  tanggalDokumen?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  statusVerifikasi: 'TERVERIFIKASI' | 'MENUNGGU_VERIFIKASI' | 'DITOLAK';
  catatanVerifikasi?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export type StatusPeriode = 'DRAFT' | 'DIPERIKSA' | 'DISAHKAN';

export interface DukPeriod {
  id: string;
  namaPeriode: string; // misal: "Periode 1 Januari 2026"
  tahun: number;
  tanggalAcuan: string; // YYYY-MM-DD
  status: StatusPeriode;
  tanggalPengesahan?: string;
  pejabatPengesah?: string; // misal: Sahwanto, S.Pd.
  nipPengesah?: string;
  keterangan?: string;
  jumlahPegawai: number;
  jumlahPns: number;
  jumlahPppk: number;
  jumlahNonAsn: number;
  isAktif: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DukSnapshot {
  id: string;
  periodId: string;
  periodName: string;
  tanggalPengesahan: string;
  snapshotData: string; // JSON string of DukItem[]
  disahkanOleh: string;
  nipPengesah: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userEmail: string;
  userName: string;
  details: string;
  timestamp: string;
}

export interface AppSettings {
  namaSekolah: string;
  npsn: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  alamatLengkap: string;
  kodePos: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  pangkatKepalaSekolah: string;
  logoUrl?: string;
  tampilkanPenanggungJawabHeader?: boolean;
  kopSuratUrl?: string;
  tipeKopSurat?: 'gambar' | 'teks';
  kopPemerintah?: string;
  kopDinas?: string;
  kopSekolah?: string;
  kopAlamat?: string;
  kopKontak?: string;
  dukOrderConfig?: {
    prioritasGolongan: boolean;
    prioritasTmtPangkat: boolean;
    prioritasJabatan: boolean;
    prioritasMasaKerja: boolean;
    prioritasPendidikan: boolean;
    prioritasUsia: boolean;
  };
  updatedAt: string;
}
