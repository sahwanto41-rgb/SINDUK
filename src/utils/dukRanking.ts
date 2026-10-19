import { Employee, DukItem } from '../types';

// Bobot Golongan Ruang PNS sesuai hierarki resmi BKN
export const GOLONGAN_PNS_RANK: Record<string, number> = {
  'IV/e': 17,
  'IV/d': 16,
  'IV/c': 15,
  'IV/b': 14,
  'IV/a': 13,
  'III/d': 12,
  'III/c': 11,
  'III/b': 10,
  'III/a': 9,
  'II/d': 8,
  'II/c': 7,
  'II/b': 6,
  'II/a': 5,
  'I/d': 4,
  'I/c': 3,
  'I/b': 2,
  'I/a': 1,
};

// Bobot Golongan PPPK
export const GOLONGAN_PPPK_RANK: Record<string, number> = {
  'Golongan XVII': 17,
  'Golongan XVI': 16,
  'Golongan XV': 15,
  'Golongan XIV': 14,
  'Golongan XIII': 13,
  'Golongan XII': 12,
  'Golongan XI': 11,
  'Golongan X': 10,
  'Golongan IX': 9,
  'Golongan VIII': 8,
  'Golongan VII': 7,
  'Golongan VI': 6,
  'Golongan V': 5,
  'Golongan IV': 4,
  'Golongan III': 3,
  'Golongan II': 2,
  'Golongan I': 1,
};

// Bobot Jenjang Pendidikan Formal
export const JENJANG_PENDIDIKAN_RANK: Record<string, number> = {
  'S-3': 10,
  'S-2': 9,
  'S-1': 8,
  'D-IV': 8,
  'D-III': 7,
  'D-II': 6,
  'D-I': 5,
  'SMA/SMK': 4,
  'SMP': 3,
  'SD': 2,
};

// Pangkat resmi PNS
export const PANGKAT_PNS_LIST = [
  { gol: 'IV/e', pangkat: 'Pembina Utama' },
  { gol: 'IV/d', pangkat: 'Pembina Utama Madya' },
  { gol: 'IV/c', pangkat: 'Pembina Utama Muda' },
  { gol: 'IV/b', pangkat: 'Pembina Tingkat I' },
  { gol: 'IV/a', pangkat: 'Pembina' },
  { gol: 'III/d', pangkat: 'Penata Tingkat I' },
  { gol: 'III/c', pangkat: 'Penata' },
  { gol: 'III/b', pangkat: 'Penata Muda Tingkat I' },
  { gol: 'III/a', pangkat: 'Penata Muda' },
  { gol: 'II/d', pangkat: 'Pengatur Tingkat I' },
  { gol: 'II/c', pangkat: 'Pengatur' },
  { gol: 'II/b', pangkat: 'Pengatur Muda Tingkat I' },
  { gol: 'II/a', pangkat: 'Pengatur Muda' },
  { gol: 'I/d', pangkat: 'Juru Tingkat I' },
  { gol: 'I/c', pangkat: 'Juru' },
  { gol: 'I/b', pangkat: 'Juru Muda Tingkat I' },
  { gol: 'I/a', pangkat: 'Juru Muda' },
];

/**
 * Format tanggal Indonesia: DD MMMM YYYY
 */
export function formatTanggalIndonesia(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Format tanggal singkat: DD/MM/YYYY
 */
export function formatTanggalSingkat(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Hitung selisih masa kerja (Tahun & Bulan) dari tanggal awal ke tanggal acuan
 */
export function hitungMasaKerjaOtomatis(startDateStr: string, refDateStr: string = new Date().toISOString().split('T')[0]): { tahun: number; bulan: number } {
  if (!startDateStr) return { tahun: 0, bulan: 0 };
  const start = new Date(startDateStr);
  const ref = new Date(refDateStr);
  if (isNaN(start.getTime()) || isNaN(ref.getTime()) || ref < start) {
    return { tahun: 0, bulan: 0 };
  }

  let years = ref.getFullYear() - start.getFullYear();
  let months = ref.getMonth() - start.getMonth();
  if (ref.getDate() < start.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { tahun: Math.max(0, years), bulan: Math.max(0, months) };
}

/**
 * Hitung usia dalam tahun dari tanggal lahir
 */
export function hitungUsia(tanggalLahir?: string): number {
  if (!tanggalLahir) return 0;
  const birth = new Date(tanggalLahir);
  if (isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Evaluasi kelengkapan data pegawai
 */
export function checkEmployeeDataCompleteness(emp: Partial<Employee>): { isLengkap: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!emp.namaLengkap) missing.push('Nama Lengkap');
  if (!emp.statusKepegawaian) missing.push('Status Kepegawaian');
  if (!emp.tmtSekolah) missing.push('TMT di SD Negeri Lanas 1');
  if (!emp.tempatLahir) missing.push('Tempat Lahir');
  if (!emp.tanggalLahir) missing.push('Tanggal Lahir');
  if (!emp.pendidikanTerakhir) missing.push('Pendidikan Terakhir');

  if (emp.statusKepegawaian === 'PNS') {
    if (!emp.nip) missing.push('NIP 18 Digit');
    if (!emp.golonganRuang) missing.push('Golongan Ruang');
    if (!emp.pangkat) missing.push('Pangkat');
    if (!emp.tmtPangkat) missing.push('TMT Pangkat');
    if (!emp.jabatanUtama) missing.push('Jabatan');
    if (!emp.tmtJabatan) missing.push('TMT Jabatan');
    if (emp.mkGolonganTahun === undefined && emp.mkGolonganBulan === undefined) {
      missing.push('Masa Kerja Golongan');
    }
  } else if (emp.statusKepegawaian === 'PPPK') {
    if (!emp.nip) missing.push('NIP PPPK');
    if (!emp.golonganPppk) missing.push('Golongan PPPK');
    if (!emp.jabatanUtama) missing.push('Jabatan');
  }

  return {
    isLengkap: missing.length === 0,
    missing,
  };
}

/**
 * ENGINE RESMI PENGURUTAN DUK PNS
 * Berdasarkan PP No. 15 Tahun 1979 jo. Keputusan Kepala BKN:
 * 1. Pangkat / Golongan Ruang (Tertinggi ke terendah)
 * 2. TMT Pangkat (Terlama / lebih awal)
 * 3. Jabatan (Kepala Sekolah > Guru Madya/Muda/Pertama > Pelaksana; lalu TMT Jabatan)
 * 4. Masa Kerja Golongan (Total bulan terbanyak)
 * 5. Pendidikan (Jenjang tertinggi & tahun lulus lebih dahulu)
 * 6. Usia / Tanggal Lahir (Usia lebih tua / tanggal lahir lebih awal)
 */
export function sortPnsDuk(employees: Employee[]): DukItem[] {
  // Hanya ambil PNS yang aktif
  const pnsList = employees.filter(e => e.statusKepegawaian === 'PNS' && e.statusAktif === 'AKTIF');

  const scoredList = pnsList.map(emp => {
    const completeness = checkEmployeeDataCompleteness(emp);
    const golRank = emp.golonganRuang ? (GOLONGAN_PNS_RANK[emp.golonganRuang] || 0) : 0;
    const tmtPangkatTime = emp.tmtPangkat ? new Date(emp.tmtPangkat).getTime() : Number.MAX_SAFE_INTEGER;
    
    // Bobot jabatan di SD Negeri Lanas 1
    let jabatanRank = 1;
    const jabLower = (emp.jabatanUtama || '').toLowerCase();
    if (jabLower.includes('kepala sekolah')) jabatanRank = 5;
    else if (jabLower.includes('madya')) jabatanRank = 4;
    else if (jabLower.includes('muda')) jabatanRank = 3;
    else if (jabLower.includes('pertama')) jabatanRank = 2;
    else if (jabLower.includes('guru')) jabatanRank = 2;

    const tmtJabatanTime = emp.tmtJabatan ? new Date(emp.tmtJabatan).getTime() : Number.MAX_SAFE_INTEGER;
    const mkgBulan = (emp.mkGolonganTahun || 0) * 12 + (emp.mkGolonganBulan || 0);
    const eduRank = emp.jenjangPendidikan ? (JENJANG_PENDIDIKAN_RANK[emp.jenjangPendidikan] || 0) : 0;
    const tahunLulusNum = emp.tahunLulus ? parseInt(emp.tahunLulus, 10) : Number.MAX_SAFE_INTEGER;
    const birthTime = emp.tanggalLahir ? new Date(emp.tanggalLahir).getTime() : Number.MAX_SAFE_INTEGER;

    return {
      emp,
      completeness,
      golRank,
      tmtPangkatTime,
      jabatanRank,
      tmtJabatanTime,
      mkgBulan,
      eduRank,
      tahunLulusNum,
      birthTime,
    };
  });

  // Sort per official rule cascade
  scoredList.sort((a, b) => {
    // 1. Pangkat / Golongan Ruang (tinggi ke rendah)
    if (a.golRank !== b.golRank) return b.golRank - a.golRank;

    // 2. TMT Pangkat (tanggal lebih awal / terlama lebih berhak)
    if (a.tmtPangkatTime !== b.tmtPangkatTime) return a.tmtPangkatTime - b.tmtPangkatTime;

    // 3. Jabatan (jabatan lebih tinggi)
    if (a.jabatanRank !== b.jabatanRank) return b.jabatanRank - a.jabatanRank;

    // 3b. TMT Jabatan (lebih awal)
    if (a.tmtJabatanTime !== b.tmtJabatanTime) return a.tmtJabatanTime - b.tmtJabatanTime;

    // 4. Masa Kerja Golongan (total bulan lebih banyak)
    if (a.mkgBulan !== b.mkgBulan) return b.mkgBulan - a.mkgBulan;

    // 5. Jenjang Pendidikan (lebih tinggi)
    if (a.eduRank !== b.eduRank) return b.eduRank - a.eduRank;

    // 5b. Tahun kelulusan (lebih lama lulus)
    if (a.tahunLulusNum !== b.tahunLulusNum) return a.tahunLulusNum - b.tahunLulusNum;

    // 6. Usia / Tanggal Lahir (lebih tua / lahir lebih awal)
    return a.birthTime - b.birthTime;
  });

  return scoredList.map((item, index) => {
    const e = item.emp;
    const alasanUrutan: string[] = [];

    alasanUrutan.push(`1. Golongan: ${e.golonganRuang || 'Belum diisi'} (${e.pangkat || '-'})`);
    alasanUrutan.push(`2. TMT Pangkat: ${formatTanggalSingkat(e.tmtPangkat)}`);
    alasanUrutan.push(`3. Jabatan: ${e.jabatanUtama || '-'} (TMT: ${formatTanggalSingkat(e.tmtJabatan)})`);
    alasanUrutan.push(`4. MK Golongan: ${e.mkGolonganTahun || 0} Thn ${e.mkGolonganBulan || 0} Bln`);
    alasanUrutan.push(`5. Pendidikan: ${e.jenjangPendidikan || '-'} (${e.tahunLulus || '-'})`);
    alasanUrutan.push(`6. Tanggal Lahir: ${formatTanggalSingkat(e.tanggalLahir)} (Usia ${hitungUsia(e.tanggalLahir)} Thn)`);

    return {
      noUrut: index + 1,
      employee: e,
      pangkatGolonganText: `${e.pangkat || '-'} (${e.golonganRuang || '-'})`,
      tmtPangkatFormatted: formatTanggalSingkat(e.tmtPangkat),
      jabatanFormatted: e.jabatanUtama || '-',
      tmtJabatanFormatted: formatTanggalSingkat(e.tmtJabatan),
      tmtSekolahFormatted: formatTanggalSingkat(e.tmtSekolah),
      mkGolonganFormatted: `${e.mkGolonganTahun ?? 0} Th ${e.mkGolonganBulan ?? 0} Bl`,
      mkKeseluruhanFormatted: `${e.mkKeseluruhanTahun ?? 0} Th ${e.mkKeseluruhanBulan ?? 0} Bl`,
      pendidikanFormatted: `${e.jenjangPendidikan || ''} ${e.programStudi || e.pendidikanTerakhir || ''}`.trim(),
      ttlFormatted: `${e.tempatLahir || '-'}, ${formatTanggalSingkat(e.tanggalLahir)}`,
      usiaTahun: hitungUsia(e.tanggalLahir),
      alasanUrutan,
      isLengkap: item.completeness.isLengkap,
      missingDataNotes: item.completeness.missing,
    };
  });
}

/**
 * REKAPITULASI DAFTAR PPPK
 */
export function sortPppkRegister(employees: Employee[]): DukItem[] {
  const pppkList = employees.filter(e => e.statusKepegawaian === 'PPPK' && e.statusAktif === 'AKTIF');

  pppkList.sort((a, b) => {
    const rankA = a.golonganPppk ? (GOLONGAN_PPPK_RANK[a.golonganPppk] || 0) : 0;
    const rankB = b.golonganPppk ? (GOLONGAN_PPPK_RANK[b.golonganPppk] || 0) : 0;
    if (rankA !== rankB) return rankB - rankA;

    const tmtA = a.tmtSkPppk ? new Date(a.tmtSkPppk).getTime() : Number.MAX_SAFE_INTEGER;
    const tmtB = b.tmtSkPppk ? new Date(b.tmtSkPppk).getTime() : Number.MAX_SAFE_INTEGER;
    if (tmtA !== tmtB) return tmtA - tmtB;

    const birthA = a.tanggalLahir ? new Date(a.tanggalLahir).getTime() : Number.MAX_SAFE_INTEGER;
    const birthB = b.tanggalLahir ? new Date(b.tanggalLahir).getTime() : Number.MAX_SAFE_INTEGER;
    return birthA - birthB;
  });

  return pppkList.map((e, index) => {
    const completeness = checkEmployeeDataCompleteness(e);
    return {
      noUrut: index + 1,
      employee: e,
      pangkatGolonganText: e.golonganPppk || 'PPPK',
      tmtPangkatFormatted: formatTanggalSingkat(e.tmtSkPppk),
      jabatanFormatted: e.jabatanUtama || '-',
      tmtJabatanFormatted: formatTanggalSingkat(e.tmtJabatan),
      tmtSekolahFormatted: formatTanggalSingkat(e.tmtSekolah),
      mkGolonganFormatted: `${e.mkGolonganTahun ?? 0} Th ${e.mkGolonganBulan ?? 0} Bl`,
      mkKeseluruhanFormatted: `${e.mkKeseluruhanTahun ?? 0} Th ${e.mkKeseluruhanBulan ?? 0} Bl`,
      pendidikanFormatted: `${e.jenjangPendidikan || ''} ${e.programStudi || e.pendidikanTerakhir || ''}`.trim(),
      ttlFormatted: `${e.tempatLahir || '-'}, ${formatTanggalSingkat(e.tanggalLahir)}`,
      usiaTahun: hitungUsia(e.tanggalLahir),
      alasanUrutan: [`Golongan PPPK: ${e.golonganPppk || '-'}`, `TMT: ${formatTanggalSingkat(e.tmtSkPppk)}`],
      isLengkap: completeness.isLengkap,
      missingDataNotes: completeness.missing,
    };
  });
}

/**
 * REKAPITULASI DAFTAR NON-ASN
 */
export function sortNonAsnRegister(employees: Employee[]): DukItem[] {
  const nonAsnList = employees.filter(e => e.statusKepegawaian === 'NON_ASN' && e.statusAktif === 'AKTIF');

  nonAsnList.sort((a, b) => {
    const tmtSekolahA = a.tmtSekolah ? new Date(a.tmtSekolah).getTime() : Number.MAX_SAFE_INTEGER;
    const tmtSekolahB = b.tmtSekolah ? new Date(b.tmtSekolah).getTime() : Number.MAX_SAFE_INTEGER;
    if (tmtSekolahA !== tmtSekolahB) return tmtSekolahA - tmtSekolahB;

    const birthA = a.tanggalLahir ? new Date(a.tanggalLahir).getTime() : Number.MAX_SAFE_INTEGER;
    const birthB = b.tanggalLahir ? new Date(b.tanggalLahir).getTime() : Number.MAX_SAFE_INTEGER;
    return birthA - birthB;
  });

  return nonAsnList.map((e, index) => {
    const completeness = checkEmployeeDataCompleteness(e);
    return {
      noUrut: index + 1,
      employee: e,
      pangkatGolonganText: 'Non-ASN / Honorer',
      tmtPangkatFormatted: '-',
      jabatanFormatted: e.jabatanUtama || '-',
      tmtJabatanFormatted: formatTanggalSingkat(e.tmtJabatan),
      tmtSekolahFormatted: formatTanggalSingkat(e.tmtSekolah),
      mkGolonganFormatted: '-',
      mkKeseluruhanFormatted: `${e.mkKeseluruhanTahun ?? 0} Th ${e.mkKeseluruhanBulan ?? 0} Bl`,
      pendidikanFormatted: `${e.jenjangPendidikan || ''} ${e.programStudi || e.pendidikanTerakhir || ''}`.trim(),
      ttlFormatted: `${e.tempatLahir || '-'}, ${formatTanggalSingkat(e.tanggalLahir)}`,
      usiaTahun: hitungUsia(e.tanggalLahir),
      alasanUrutan: [`TMT di SD Negeri Lanas 1: ${formatTanggalSingkat(e.tmtSekolah)}`],
      isLengkap: completeness.isLengkap,
      missingDataNotes: completeness.missing,
    };
  });
}
