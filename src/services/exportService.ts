import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, DukItem, AppSettings } from '../types';
import { formatTanggalIndonesia, formatTanggalSingkat, checkEmployeeDataCompleteness } from '../utils/dukRanking';

export interface ImportValidationRow {
  rowNumber: number;
  data: Partial<Employee>;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: ImportValidationRow[];
}

/**
 * Buat dan unduh template resmi Excel (.xlsx) untuk Master Data Pegawai
 */
export function downloadExcelTemplate() {
  const headers = [
    'NIP / NIK',
    'Nama Lengkap',
    'Gelar Depan',
    'Gelar Belakang',
    'Tempat Lahir',
    'Tanggal Lahir (YYYY-MM-DD)',
    'Jenis Kelamin (L/P)',
    'Alamat',
    'No Telepon',
    'Status Kepegawaian (PNS/PPPK/NON_ASN)',
    'Jenis PTK (GURU/TENAGA_KEPENDIDIKAN)',
    'Pangkat',
    'Golongan Ruang',
    'TMT Pangkat (YYYY-MM-DD)',
    'No SK Pangkat',
    'Jabatan Utama',
    'TMT Jabatan (YYYY-MM-DD)',
    'TMT di SD Negeri Lanas 1 (YYYY-MM-DD)',
    'Pendidikan Terakhir',
    'Jenjang (SD/SMP/SMA/SMK/D-III/S-1/S-2)',
    'Tahun Lulus',
    'Masa Kerja Golongan Tahun',
    'Masa Kerja Golongan Bulan',
    'Masa Kerja Total Tahun',
    'Masa Kerja Total Bulan',
    'Golongan PPPK (Bila PPPK)',
    'TMT PPPK (Bila PPPK)',
    'Keterangan',
  ];

  const sampleRows = [
    [
      '196805121993031008',
      'Sahwanto',
      '',
      'S.Pd.',
      'Bondowoso',
      '1968-05-12',
      'L',
      'Botolinggo, Bondowoso',
      '081234567890',
      'PNS',
      'GURU',
      'Pembina',
      'IV/a',
      '2019-10-01',
      '823.4/1420/430.10.1/2019',
      'Kepala Sekolah',
      '2020-03-01',
      '2020-03-01',
      'S-1 Pendidikan Guru Sekolah Dasar',
      'S-1',
      '2008',
      26,
      10,
      32,
      10,
      '',
      '',
      'Kepala Sekolah Definitif',
    ],
    [
      '199204152022211005',
      'Agus Setiawan',
      '',
      'S.Pd.',
      'Bondowoso',
      '1992-04-15',
      'L',
      'Botolinggo',
      '085234567891',
      'PPPK',
      'GURU',
      '',
      '',
      '',
      '',
      'Guru PJOK Ahli Pertama',
      '2022-03-01',
      '2022-03-01',
      'S-1 Pendidikan Jasmani Olahraga',
      'S-1',
      '2015',
      3,
      10,
      3,
      10,
      'Golongan IX',
      '2022-03-01',
      'Guru PJOK',
    ],
    [
      '-',
      'Rudi Hartono',
      '',
      'S.Kom.',
      'Bondowoso',
      '1996-01-20',
      'L',
      'Lanas, Botolinggo',
      '087812345678',
      'NON_ASN',
      'TENAGA_KEPENDIDIKAN',
      '',
      '',
      '',
      '',
      'Operator Dapodik',
      '2018-07-16',
      '2018-07-16',
      'S-1 Sistem Informasi',
      'S-1',
      '2018',
      0,
      0,
      7,
      5,
      '',
      '',
      'Operator Sekolah',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 22 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template SI-DUK SMART');
  XLSX.writeFile(wb, 'Template_Impor_DUK_SMART_SDN_Lanas_1.xlsx');
}

/**
 * Validasi dan Parsing berkas Excel yang diunggah
 */
export async function parseAndValidateExcel(
  file: File,
  existingEmployees: Employee[]
): Promise<ImportSummary> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'binary', raw: true });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (jsonData.length <= 1) {
          throw new Error('Berkas Excel kosong atau tidak memiliki data.');
        }

        const rows: ImportValidationRow[] = [];
        const seenNips = new Set<string>();
        const existingNips = new Set(
          existingEmployees
            .map((emp) => emp.nip?.trim())
            .filter((n) => n && n !== '-')
        );

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || !row[1]) continue; // lewati baris kosong

          const rawNip = String(row[0] || '').trim();
          const namaLengkap = String(row[1] || '').trim();
          const gelarDepan = String(row[2] || '').trim();
          const gelarBelakang = String(row[3] || '').trim();
          const tempatLahir = String(row[4] || '').trim();
          const tanggalLahir = String(row[5] || '').trim();
          const rawJk = String(row[6] || '').trim().toUpperCase();
          const jenisKelamin = rawJk === 'P' || rawJk === 'PEREMPUAN' ? 'P' : 'L';
          const alamat = String(row[7] || '').trim();
          const noTelepon = String(row[8] || '').trim();
          const rawStatus = String(row[9] || '').trim().toUpperCase();
          const statusKepegawaian = rawStatus === 'PPPK' ? 'PPPK' : rawStatus === 'NON_ASN' || rawStatus === 'NON-ASN' || rawStatus === 'HONORER' ? 'NON_ASN' : 'PNS';
          const rawPtk = String(row[10] || '').trim().toUpperCase();
          const jenisPtk = rawPtk.includes('TENAGA') || rawPtk.includes('OPERATOR') || rawPtk.includes('PENJAGA') ? 'TENAGA_KEPENDIDIKAN' : 'GURU';

          const pangkat = String(row[11] || '').trim();
          const golonganRuang = String(row[12] || '').trim();
          const tmtPangkat = String(row[13] || '').trim();
          const noSkPangkat = String(row[14] || '').trim();
          const jabatanUtama = String(row[15] || '').trim();
          const tmtJabatan = String(row[16] || '').trim();
          const tmtSekolah = String(row[17] || '').trim();
          const pendidikanTerakhir = String(row[18] || '').trim();
          const jenjangPendidikan: any = String(row[19] || 'S-1').trim();
          const tahunLulus = String(row[20] || '').trim();
          const mkGolonganTahun = Number(row[21]) || 0;
          const mkGolonganBulan = Number(row[22]) || 0;
          const mkKeseluruhanTahun = Number(row[23]) || 0;
          const mkKeseluruhanBulan = Number(row[24]) || 0;
          const golonganPppk = String(row[25] || '').trim();
          const tmtSkPppk = String(row[26] || '').trim();
          const keterangan = String(row[27] || '').trim();

          const errors: string[] = [];
          const warnings: string[] = [];

          // Validasi wajib
          if (!namaLengkap) errors.push('Nama lengkap wajib diisi');
          if (!tmtSekolah) errors.push('TMT di SD Negeri Lanas 1 wajib diisi');

          // Validasi duplikasi NIP
          if (rawNip && rawNip !== '-') {
            if (seenNips.has(rawNip)) {
              errors.push(`NIP ${rawNip} duplikat di dalam file ini`);
            } else if (existingNips.has(rawNip)) {
              warnings.push(`NIP ${rawNip} sudah ada di database (akan dilakukan pembaruan jika dikonfirmasi)`);
            }
            seenNips.add(rawNip);
          }

          if (statusKepegawaian === 'PNS') {
            if (!rawNip || rawNip === '-') errors.push('NIP PNS wajib diisi 18 digit');
            if (!golonganRuang) errors.push('Golongan ruang PNS wajib diisi (misal: IV/a, III/d)');
            if (!tmtPangkat) warnings.push('TMT Pangkat belum diisi');
            if (!jabatanUtama) errors.push('Jabatan utama wajib diisi');
          }

          const parsedEmployee: Partial<Employee> = {
            id: `emp-imp-${Date.now()}-${i}`,
            nip: rawNip || '-',
            namaLengkap,
            gelarDepan,
            gelarBelakang,
            tempatLahir: tempatLahir || 'Bondowoso',
            tanggalLahir: tanggalLahir || '1990-01-01',
            jenisKelamin,
            alamat,
            noTelepon,
            statusKepegawaian,
            jenisPtk,
            pangkat,
            golonganRuang,
            tmtPangkat,
            noSkPangkat,
            jabatanUtama: jabatanUtama || (statusKepegawaian === 'PNS' ? 'Guru Kelas' : 'Tenaga Pendidik'),
            tmtJabatan: tmtJabatan || tmtSekolah,
            tmtSekolah,
            tglMulaiTugasLanas1: tmtSekolah,
            pendidikanTerakhir: pendidikanTerakhir || 'S-1 PGSD',
            jenjangPendidikan,
            tahunLulus,
            mkGolonganTahun,
            mkGolonganBulan,
            mkKeseluruhanTahun,
            mkKeseluruhanBulan,
            golonganPppk,
            tmtSkPppk,
            statusAktif: 'AKTIF',
            keterangan,
            isDataLengkap: errors.length === 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          rows.push({
            rowNumber: i + 1,
            data: parsedEmployee,
            isValid: errors.length === 0,
            errors,
            warnings,
          });
        }

        const validCount = rows.filter((r) => r.isValid).length;
        resolve({
          totalRows: rows.length,
          validRows: validCount,
          invalidRows: rows.length - validCount,
          rows,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

/**
 * Ekspor Data DUK ke Berkas Excel (.xlsx)
 */
export function exportDukToExcel(
  items: DukItem[],
  title: string = 'Daftar Urut Kepangkatan (DUK)',
  settings?: AppSettings
) {
  const headers = [
    'No. Urut',
    'Nama Lengkap & Gelar',
    'NIP',
    'Tempat, Tanggal Lahir',
    'Jenis Kelamin',
    'Pangkat / Gol. Ruang',
    'TMT Pangkat',
    'Jabatan',
    'TMT Jabatan',
    'TMT di Sekolah Ini',
    'Masa Kerja Golongan',
    'Masa Kerja Keseluruhan',
    'Pendidikan Terakhir',
    'Kelengkapan Data',
    'Keterangan',
  ];

  const dataRows = items.map((item) => [
    item.noUrut,
    `${item.employee.gelarDepan ? item.employee.gelarDepan + ' ' : ''}${item.employee.namaLengkap}${item.employee.gelarBelakang ? ', ' + item.employee.gelarBelakang : ''}`,
    `'${item.employee.nip || '-'}`, // preserve text format
    item.ttlFormatted,
    item.employee.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
    item.pangkatGolonganText,
    item.tmtPangkatFormatted,
    item.jabatanFormatted,
    item.tmtJabatanFormatted,
    item.tmtSekolahFormatted,
    item.mkGolonganFormatted,
    item.mkKeseluruhanFormatted,
    item.pendidikanFormatted,
    item.isLengkap ? 'Lengkap' : 'Draf - Belum Lengkap',
    item.employee.keterangan || '-',
  ]);

  const schoolName = settings?.namaSekolah || 'UPTD SPF SD NEGERI LANAS 1';
  const headerInfo = [
    [schoolName.toUpperCase()],
    [`KECAMATAN ${settings?.kecamatan?.toUpperCase() || 'BOTOLINGGO'} - KABUPATEN ${settings?.kabupaten?.toUpperCase() || 'BONDOWOSO'}`],
    [title.toUpperCase()],
    [`Tanggal Unduh: ${formatTanggalIndonesia(new Date().toISOString().split('T')[0])}`],
    [], // spasi
  ];

  const ws = XLSX.utils.aoa_to_sheet([...headerInfo, headers, ...dataRows]);
  ws['!cols'] = [
    { wch: 8 },  // No
    { wch: 28 }, // Nama
    { wch: 22 }, // NIP
    { wch: 24 }, // TTL
    { wch: 14 }, // JK
    { wch: 20 }, // Pangkat Gol
    { wch: 14 }, // TMT Pangkat
    { wch: 24 }, // Jabatan
    { wch: 14 }, // TMT Jabatan
    { wch: 18 }, // TMT Sekolah
    { wch: 18 }, // MKG
    { wch: 18 }, // MK Total
    { wch: 26 }, // Pendidikan
    { wch: 16 }, // Status
    { wch: 20 }, // Keterangan
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DUK Lanas 1');
  const filename = `DUK_${title.replace(/\s+/g, '_')}_SDN_Lanas_1.xlsx`;
  XLSX.writeFile(wb, filename);
}

function renderPdfTextKop(
  doc: jsPDF,
  pageWidth: number,
  title: string,
  periodeText: string,
  settings?: AppSettings
) {
  const kopPem = settings?.kopPemerintah || 'PEMERINTAH KABUPATEN BONDOWOSO';
  const kopDin = settings?.kopDinas || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
  const kopSek = settings?.kopSekolah || settings?.namaSekolah?.toUpperCase() || 'UPTD SPF SD NEGERI LANAS 1';
  const kopAlm = settings?.kopAlamat || `Kecamatan ${settings?.kecamatan || 'Botolinggo'}, Kabupaten ${settings?.kabupaten || 'Bondowoso'}, Jawa Timur`;
  const kopKtk = settings?.kopKontak || `Kode Pos ${settings?.kodePos || '68284'}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(kopPem, pageWidth / 2, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.text(kopDin, pageWidth / 2, 19, { align: 'center' });
  doc.setFontSize(13);
  doc.text(kopSek, pageWidth / 2, 25, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${kopAlm} - ${kopKtk}`, pageWidth / 2, 30, { align: 'center' });

  // Garis Kop Dobel
  doc.setLineWidth(0.8);
  doc.line(14, 32, pageWidth - 14, 32);
  doc.setLineWidth(0.2);
  doc.line(14, 33, pageWidth - 14, 33);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), pageWidth / 2, 40, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Keadaan: ${periodeText}`, pageWidth / 2, 45, { align: 'center' });
}

/**
 * Ekspor Data DUK ke Berkas PDF Resmi (Kop Sekolah, A4 Landscape)
 */
export function exportDukToPdf(
  items: DukItem[],
  title: string = 'DAFTAR URUT KEPANGKATAN (DUK) PEGAWAI NEGERI SIPIL',
  periodeText: string = 'Periode 1 Januari 2026',
  settings?: AppSettings
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Cek apakah menggunakan gambar KOP resmi atau teks terstruktur
  const useImageKop = Boolean(settings?.kopSuratUrl && (settings.tipeKopSurat === 'gambar' || !settings.tipeKopSurat));

  if (useImageKop && settings?.kopSuratUrl) {
    try {
      const imgFormat = settings.kopSuratUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(settings.kopSuratUrl, imgFormat, 14, 8, pageWidth - 28, 25, undefined, 'FAST');
      doc.setLineWidth(0.6);
      doc.line(14, 34, pageWidth - 14, 34);

      // Judul Dokumen
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(title.toUpperCase(), pageWidth / 2, 40, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Keadaan: ${periodeText}`, pageWidth / 2, 45, { align: 'center' });
    } catch (e) {
      console.warn('Gagal memuat gambar KOP pada PDF, menggunakan teks:', e);
      // Fallback ke teks
      renderPdfTextKop(doc, pageWidth, title, periodeText, settings);
    }
  } else {
    renderPdfTextKop(doc, pageWidth, title, periodeText, settings);
  }

  // Tabel Data DUK
  const tableHead = [
    [
      'No',
      'Nama Pegawai\nNIP',
      'Tempat & Tgl Lahir\nJenis Kelamin',
      'Pangkat\nGol. Ruang',
      'TMT\nPangkat',
      'Jabatan\nUnit Kerja',
      'TMT\nJabatan',
      'TMT di\nSekolah Ini',
      'Masa Kerja\nGol. / Total',
      'Pendidikan Terakhir\nTahun Kelulusan',
      'Ket.',
    ],
  ];

  const tableBody = items.map((item) => {
    const e = item.employee;
    const namaFormatted = `${e.gelarDepan ? e.gelarDepan + ' ' : ''}${e.namaLengkap}${e.gelarBelakang ? ', ' + e.gelarBelakang : ''}\n${e.nip || '-'}`;
    const ttlFormatted = `${e.tempatLahir || '-'},\n${formatTanggalSingkat(e.tanggalLahir)} (${e.jenisKelamin})`;
    const pangkatFormatted = `${item.pangkatGolonganText}`;
    const jabatanFormatted = `${item.jabatanFormatted}`;
    const mkFormatted = `Gol: ${item.mkGolonganFormatted}\nTot: ${item.mkKeseluruhanFormatted}`;
    const eduFormatted = `${item.pendidikanFormatted}\nLulus: ${e.tahunLulus || '-'}`;

    return [
      item.noUrut,
      namaFormatted,
      ttlFormatted,
      pangkatFormatted,
      item.tmtPangkatFormatted,
      jabatanFormatted,
      item.tmtJabatanFormatted,
      item.tmtSekolahFormatted,
      mkFormatted,
      eduFormatted,
      e.keterangan || '-',
    ];
  });

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 49,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Deep Navy
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, // No
      1: { cellWidth: 42 },                   // Nama & NIP
      2: { cellWidth: 32 },                   // TTL & JK
      3: { cellWidth: 28 },                   // Pangkat
      4: { cellWidth: 18, halign: 'center' }, // TMT Pangkat
      5: { cellWidth: 35 },                   // Jabatan
      6: { cellWidth: 18, halign: 'center' }, // TMT Jabatan
      7: { cellWidth: 18, halign: 'center' }, // TMT Sekolah
      8: { cellWidth: 26 },                   // MK
      9: { cellWidth: 34 },                   // Pendidikan
      10: { cellWidth: 16 },                  // Ket
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page number
      const str = `Halaman ${data.pageNumber}`;
      doc.setFontSize(7.5);
      doc.setTextColor(100);
      doc.text(str, pageWidth - 30, doc.internal.pageSize.getHeight() - 8);
    },
  });

  // Tanda Tangan Pengesahan Kepala Sekolah
  const finalY = (doc as any).lastAutoTable.finalY || 160;
  let ttdY = finalY + 12;
  if (ttdY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    ttdY = 25;
  }

  const ttdX = pageWidth - 80;
  const tglFormatted = formatTanggalIndonesia(new Date().toISOString().split('T')[0]);
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text(`Bondowoso, ${tglFormatted}`, ttdX, ttdY);
  doc.text('Kepala UPTD SPF SD Negeri Lanas 1,', ttdX, ttdY + 5);

  doc.setFont('helvetica', 'bold');
  const namaKs = settings?.namaKepalaSekolah || 'SAHWANTO, S.Pd.';
  const nipKs = settings?.nipKepalaSekolah || '19680512 199303 1 008';
  const pangkatKs = settings?.pangkatKepalaSekolah || 'Pembina, IV/a';

  doc.text(namaKs, ttdX, ttdY + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(pangkatKs, ttdX, ttdY + 30);
  doc.text(`NIP. ${nipKs}`, ttdX, ttdY + 34);

  const filename = `DUK_${title.replace(/\s+/g, '_')}_SDN_Lanas_1.pdf`;
  doc.save(filename);
}

/**
 * Ekspor Data DUK ke Berkas HTML Mandiri (.html)
 * Berkas ini dapat dibuka di browser mana saja secara offline, dikirim via email/WhatsApp, atau dicetak langsung.
 */
export function exportDukToHtml(
  items: DukItem[],
  title: string = 'DAFTAR URUT KEPANGKATAN (DUK) PEGAWAI NEGERI SIPIL',
  periodeText: string = 'Periode 1 Januari 2026',
  settings?: AppSettings
) {
  const schoolName = settings?.namaSekolah || 'UPTD SPF SD NEGERI LANAS 1';
  const kec = settings?.kecamatan || 'Botolinggo';
  const kab = settings?.kabupaten || 'Bondowoso';
  const alamat = settings?.alamatLengkap || 'Desa Lanas, Kec. Botolinggo, Kabupaten Bondowoso, Jawa Timur';
  const namaKs = settings?.namaKepalaSekolah || 'SAHWANTO, S.Pd.';
  const nipKs = settings?.nipKepalaSekolah || '19680512 199303 1 008';
  const pangkatKs = settings?.pangkatKepalaSekolah || 'Pembina, IV/a';
  const todayStr = formatTanggalIndonesia(new Date().toISOString().split('T')[0]);

  const kopPem = settings?.kopPemerintah || 'Pemerintah Kabupaten Bondowoso';
  const kopDin = settings?.kopDinas || 'Dinas Pendidikan dan Kebudayaan';
  const kopSek = settings?.kopSekolah || settings?.namaSekolah || 'UPTD SPF SD NEGERI LANAS 1';
  const kopAlm = settings?.kopAlamat || settings?.alamatLengkap || 'Desa Lanas, Kec. Botolinggo, Kabupaten Bondowoso, Jawa Timur';
  const kopKtk = settings?.kopKontak || `Kode Pos ${settings?.kodePos || '68284'}`;
  const useImageKop = Boolean(settings?.kopSuratUrl && (settings.tipeKopSurat === 'gambar' || !settings.tipeKopSurat));

  const kopHtml = useImageKop && settings?.kopSuratUrl
    ? `<div class="kop-image-box" style="text-align:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:14px;">
        <img src="${settings.kopSuratUrl}" alt="KOP Surat Resmi" style="width:100%;max-height:120px;object-fit:contain;" />
      </div>`
    : `<div class="kop">
        <h4>${kopPem}</h4>
        <h3>${kopDin}</h3>
        <h2>${kopSek}</h2>
        <p>${kopAlm} • ${kopKtk}</p>
        <div class="kop-line"></div>
      </div>`;

  const rowsHtml = items
    .map((item) => {
      const e = item.employee;
      const namaFormatted = `${e.gelarDepan ? e.gelarDepan + ' ' : ''}${e.namaLengkap}${e.gelarBelakang ? ', ' + e.gelarBelakang : ''}`;
      return `
      <tr>
        <td style="text-align:center;font-weight:bold;">${item.noUrut}</td>
        <td>
          <div style="font-weight:bold;color:#0f172a;">${namaFormatted}</div>
          <div style="font-family:monospace;font-size:11px;color:#475569;">NIP. ${e.nip || '-'}</div>
        </td>
        <td style="text-align:center;">
          ${e.tempatLahir || '-'}, ${formatTanggalSingkat(e.tanggalLahir)}<br/>
          <span style="font-size:11px;color:#64748b;">(${e.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'})</span>
        </td>
        <td style="text-align:center;font-weight:600;color:#d97706;">
          ${item.pangkatGolonganText}
        </td>
        <td style="text-align:center;font-family:monospace;">${item.tmtPangkatFormatted}</td>
        <td>
          <div style="font-weight:500;">${item.jabatanFormatted}</div>
          ${e.jabatanTambahan ? `<div style="font-size:11px;color:#64748b;font-style:italic;">Tgs: ${e.jabatanTambahan}</div>` : ''}
        </td>
        <td style="text-align:center;font-family:monospace;">${item.tmtJabatanFormatted}</td>
        <td style="text-align:center;font-family:monospace;font-weight:bold;background-color:#fef3c7;color:#92400e;">
          ${item.tmtSekolahFormatted}
        </td>
        <td style="text-align:center;font-size:11px;">
          <div>Gol: ${item.mkGolonganFormatted}</div>
          <div style="color:#64748b;">Tot: ${item.mkKeseluruhanFormatted}</div>
        </td>
        <td>
          <div>${item.pendidikanFormatted}</div>
          <div style="font-size:11px;color:#64748b;">Lulus: ${e.tahunLulus || '-'}</div>
        </td>
        <td style="text-align:center;font-size:11px;color:#475569;">
          ${e.keterangan || '-'}
        </td>
      </tr>`;
    })
    .join('\n');

  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${schoolName}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
    }
    body {
      background-color: #f1f5f9;
      margin: 0;
      padding: 20px;
      color: #0f172a;
    }
    .sheet {
      background: white;
      max-width: 297mm;
      margin: 0 auto;
      padding: 24px 30px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
    }
    .no-print-bar {
      max-width: 297mm;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .btn-print {
      background-color: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print:hover {
      background-color: #d97706;
    }
    .kop {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 6px;
      margin-bottom: 16px;
      position: relative;
    }
    .kop h4 { margin: 0; font-size: 13px; text-transform: uppercase; font-weight: bold; }
    .kop h3 { margin: 2px 0; font-size: 12px; text-transform: uppercase; font-weight: bold; }
    .kop h2 { margin: 4px 0 2px 0; font-size: 16px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px; }
    .kop p { margin: 2px 0 0 0; font-size: 10px; color: #334155; }
    .kop-line { border-bottom: 1px solid #000; margin-top: 2px; }
    
    .doc-title {
      text-align: center;
      margin: 14px 0 16px 0;
    }
    .doc-title h2 { margin: 0; font-size: 14px; text-transform: uppercase; font-weight: bold; }
    .doc-title p { margin: 4px 0 0 0; font-size: 12px; color: #475569; }

    table.duk-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    table.duk-table th, table.duk-table td {
      border: 1px solid #000;
      padding: 6px 7px;
      vertical-align: middle;
    }
    table.duk-table th {
      background-color: #f8fafc;
      font-weight: bold;
      text-align: center;
    }
    table.duk-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .ttd-container {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
    }
    .ttd-box {
      width: 260px;
      font-size: 12px;
    }
    .ttd-box .spacer { height: 65px; }
    .ttd-box .nama { font-weight: bold; text-decoration: underline; }

    @media print {
      body { background: white; padding: 0; }
      .sheet { box-shadow: none; border-radius: 0; padding: 0; max-width: 100%; }
      .no-print-bar { display: none !important; }
      table.duk-table th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      table.duk-table td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>SI-DUK SMART - Versi HTML Mandiri / Offline</strong> • UPTD SPF SD Negeri Lanas 1
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ Cetak Dokumen Resmi
    </button>
  </div>

  <div class="sheet">
    <!-- KOP RESMI -->
    ${kopHtml}

    <!-- JUDUL -->
    <div class="doc-title">
      <h2>${title}</h2>
      <p>Keadaan: <strong>${periodeText}</strong></p>
    </div>

    <!-- TABEL DUK -->
    <table class="duk-table">
      <thead>
        <tr>
          <th style="width:28px;">No</th>
          <th>Nama Pegawai & NIP</th>
          <th>Tempat & Tgl Lahir / JK</th>
          <th>Pangkat / Gol.</th>
          <th>TMT Pangkat</th>
          <th>Jabatan</th>
          <th>TMT Jabatan</th>
          <th style="background-color:#fef3c7;color:#92400e;">TMT di SDN Lanas 1</th>
          <th>Masa Kerja</th>
          <th>Pendidikan Terakhir</th>
          <th>Ket.</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- TANDA TANGAN KEPALA SEKOLAH -->
    <div class="ttd-container">
      <div class="ttd-box">
        <p style="margin:0;">Bondowoso, ${todayStr}</p>
        <p style="margin:2px 0 0 0;font-weight:600;">Kepala UPTD SPF SD Negeri Lanas 1</p>
        <div class="spacer"></div>
        <p class="nama" style="margin:0;">${namaKs}</p>
        <p style="margin:2px 0 0 0;color:#334155;">${pangkatKs}</p>
        <p style="margin:2px 0 0 0;font-family:monospace;">NIP. ${nipKs}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DUK_${title.replace(/\s+/g, '_')}_SDN_Lanas_1.html`;
  a.click();
  URL.revokeObjectURL(url);
}

