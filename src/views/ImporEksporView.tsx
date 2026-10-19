import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  AlertCircle,
  Save,
  RefreshCw,
  FileText,
  Printer,
} from 'lucide-react';
import { Employee, AppSettings, DukItem } from '../types';
import {
  downloadExcelTemplate,
  parseAndValidateExcel,
  ImportSummary,
  exportDukToExcel,
  exportDukToPdf,
  exportDukToHtml,
} from '../services/exportService';
import { sortPnsDuk } from '../utils/dukRanking';
import { useAuth } from '../context/AuthContext';

interface ImporEksporViewProps {
  employees: Employee[];
  settings?: AppSettings | null;
  onSaveImportedEmployees: (employees: Employee[]) => Promise<void>;
  onOpenPrint: () => void;
}

export const ImporEksporView: React.FC<ImporEksporViewProps> = ({
  employees,
  settings,
  onSaveImportedEmployees,
  onOpenPrint,
}) => {
  const { userProfile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importStatus, setImportStatus] = useState<
    'idle' | 'parsed' | 'saving' | 'completed' | 'error'
  >('idle');
  const [saveResultMessage, setSaveResultMessage] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setParsing(true);
    setImportStatus('idle');

    try {
      const summary = await parseAndValidateExcel(selected, employees);
      setImportSummary(summary);
      setImportStatus('parsed');
    } catch (err: any) {
      alert(`Gagal membaca berkas Excel: ${err.message}`);
      setImportStatus('error');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importSummary) return;
    const validRows = importSummary.rows.filter((r) => r.isValid).map((r) => r.data as Employee);

    if (validRows.length === 0) {
      alert('Tidak ada baris data yang valid untuk disimpan.');
      return;
    }

    if (
      !confirm(
        `Konfirmasi simpan ${validRows.length} data pegawai ke Cloud Firestore? (Baris tidak valid sebanyak ${importSummary.invalidRows} akan dilewati).`
      )
    ) {
      return;
    }

    try {
      setImportStatus('saving');
      await onSaveImportedEmployees(validRows);
      setImportStatus('completed');
      setSaveResultMessage(
        `Berhasil mengimpor dan menyimpan ${validRows.length} data pegawai ke Cloud Firestore. ${importSummary.invalidRows} data tidak valid dilewati.`
      );
    } catch (err: any) {
      setImportStatus('error');
      setSaveResultMessage(`Gagal menyimpan data ke Firestore: ${err.message}`);
    }
  };

  const pnsItems = sortPnsDuk(employees);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <span>Impor dan Ekspor Data Kepegawaian</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola integrasi berkas Microsoft Excel (.xlsx) dan dokumen cetak resmi PDF
          </p>
        </div>

        <button
          onClick={downloadExcelTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Template Resmi Excel</span>
        </button>
      </div>

      {/* Grid: 2 Card (Import Area & Export Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION IMPOR */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-500" />
              <span>Impor Data dari Berkas Excel</span>
            </h3>
            <span className="text-[11px] font-medium text-slate-400">Format .xlsx</span>
          </div>

          <div className="p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 transition text-center space-y-3 bg-slate-50 dark:bg-slate-950/40">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-emerald-500" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Pilih atau Tarik Berkas Excel ke Sini
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pastikan menggunakan kolom sesuai template resmi SI-DUK SMART
              </p>
            </div>
            <label className="inline-block px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 cursor-pointer shadow-xs">
              Pilih Berkas Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Berkas terpilih: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {parsing && (
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span>Membaca dan memvalidasi baris data...</span>
            </div>
          )}

          {importStatus === 'completed' && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Proses Impor Selesai</p>
                <p>{saveResultMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION EKSPOR & CETAK */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Ekspor & Cetak Dokumen DUK</span>
            </h3>
            <span className="text-[11px] font-medium text-slate-400">Resmi Pemerintah</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Ekspor seluruh daftar urut kepangkatan aktif sesuai format resmi lengkap dengan kop instansi UPTD SPF SD Negeri Lanas 1 dan ruang pengesahan pejabat penandatangan.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Ekspor Berkas Microsoft Excel (.xlsx)
                </p>
                <p className="text-[11px] text-slate-500">
                  Format tabel terstruktur dengan NIP teks dan format tanggal Indonesia
                </p>
              </div>
              <button
                onClick={() => exportDukToExcel(pnsItems, 'Daftar Urut Kepangkatan', settings || undefined)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh XLSX</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Ekspor Dokumen PDF Formal (A4 Landscape)
                </p>
                <p className="text-[11px] text-slate-500">
                  Lengkap dengan Kop Surat Dinas Pendidikan Bondowoso & TTD Kepala Sekolah
                </p>
              </div>
              <button
                onClick={() => exportDukToPdf(pnsItems, 'DAFTAR URUT KEPANGKATAN PNS', 'Periode 1 Januari 2026', settings || undefined)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Unduh PDF</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Ekspor Berkas HTML Mandiri (Offline)
                </p>
                <p className="text-[11px] text-slate-500">
                  Berkas web mandiri (.html) dengan styling resmi dan tombol cetak terintegrasi
                </p>
              </div>
              <button
                onClick={() => exportDukToHtml(pnsItems, 'DAFTAR URUT KEPANGKATAN PNS', 'Periode 1 Januari 2026', settings || undefined)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh HTML</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Pratinjau Cetak Browser Langsung
                </p>
                <p className="text-[11px] text-slate-500">
                  Pratinjau cetak multi-halaman dengan pengulangan header tabel
                </p>
              </div>
              <button
                onClick={onOpenPrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Buka Cetak</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VALIDATION PREVIEW TABLE (If Parsed) */}
      {importSummary && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pratinjau & Hasil Validasi Berkas Impor
              </h3>
              <p className="text-xs text-slate-500">
                Total {importSummary.totalRows} baris •{' '}
                <span className="text-emerald-600 font-bold">{importSummary.validRows} Valid</span> •{' '}
                <span className="text-rose-600 font-bold">{importSummary.invalidRows} Tidak Valid / Duplikat</span>
              </p>
            </div>

            {importStatus === 'parsed' && (
              <button
                onClick={handleConfirmImport}
                disabled={importSummary.validRows === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Simpan {importSummary.validRows} Data Valid ke Firestore</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3 text-center">Baris</th>
                  <th className="py-2.5 px-3">Nama Lengkap</th>
                  <th className="py-2.5 px-3">NIP</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Pangkat / Gol.</th>
                  <th className="py-2.5 px-3">TMT di SDN Lanas 1</th>
                  <th className="py-2.5 px-3">Status Validasi</th>
                  <th className="py-2.5 px-3">Catatan / Kesalahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {importSummary.rows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={row.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-rose-50/40 dark:bg-rose-950/20'}
                  >
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                      {row.rowNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {row.data.namaLengkap || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{row.data.nip || '-'}</td>
                    <td className="py-2.5 px-3">{row.data.statusKepegawaian}</td>
                    <td className="py-2.5 px-3">{row.data.golonganRuang || row.data.golonganPppk || '-'}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {row.data.tmtSekolah || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Siap Diimpor</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Tidak Valid</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px]">
                      {row.errors.length > 0 && (
                        <p className="text-rose-600 font-medium">{row.errors.join('; ')}</p>
                      )}
                      {row.warnings.length > 0 && (
                        <p className="text-amber-600 italic">{row.warnings.join('; ')}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
