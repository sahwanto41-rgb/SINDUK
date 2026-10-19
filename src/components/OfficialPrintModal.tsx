import React, { useRef, useState } from 'react';
import { X, Printer, Download, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { DukItem, AppSettings } from '../types';
import { formatTanggalIndonesia, formatTanggalSingkat } from '../utils/dukRanking';
import { exportDukToPdf, exportDukToHtml } from '../services/exportService';
import { compressKopImage } from '../utils/imageCompressor';

interface OfficialPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DukItem[];
  title: string;
  periodeName: string;
  settings?: AppSettings | null;
  onUpdateSettings?: (settings: AppSettings) => Promise<void>;
}

export const OfficialPrintModal: React.FC<OfficialPrintModalProps> = ({
  isOpen,
  onClose,
  items,
  title,
  periodeName,
  settings,
  onUpdateSettings,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const kopInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingKop, setIsUploadingKop] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportDukToPdf(items, title, periodeName, settings || undefined);
  };

  const handleDownloadHtml = () => {
    exportDukToHtml(items, title, periodeName, settings || undefined);
  };

  const handleQuickKopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateSettings || !settings) return;

    setIsUploadingKop(true);
    try {
      const dataUrl = await compressKopImage(file);
      await onUpdateSettings({
        ...settings,
        kopSuratUrl: dataUrl,
        tipeKopSurat: 'gambar',
      });
    } catch (err: any) {
      alert(`Gagal mengunggah KOP surat: ${err.message}`);
    } finally {
      setIsUploadingKop(false);
      if (e.target) e.target.value = '';
    }
  };

  const todayStr = formatTanggalIndonesia(new Date().toISOString().split('T')[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-6xl my-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:my-0 print:rounded-none">
        {/* Action Header - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold">Pratinjau Cetak Dokumen Resmi</h2>
              <p className="text-[11px] text-slate-400">
                Format Standar Pemerintah RI • A4 Landscape • {settings?.kopSekolah || settings?.namaSekolah || 'SDN Lanas 1'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick KOP upload if handler provided */}
            {onUpdateSettings && (
              <>
                <input
                  ref={kopInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleQuickKopUpload}
                />
                <button
                  onClick={() => kopInputRef.current?.click()}
                  disabled={isUploadingKop}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-amber-300 hover:text-amber-200 hover:bg-slate-700 transition border border-amber-500/30"
                  title="Unggah berkas gambar KOP surat resmi instansi"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isUploadingKop ? 'Mengunggah...' : 'Unggah KOP'}</span>
                </button>
              </>
            )}

            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
              title="Unduh berkas HTML mandiri offline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh HTML</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simpan PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-600 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0">
          <div
            ref={printAreaRef}
            className="w-full max-w-[297mm] mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 text-slate-900 print:shadow-none print:border-none print:p-0 print:rounded-none"
          >
            {/* KOP RESMI PEMERINTAH (GAMBAR ATAU TEKS) */}
            {settings?.kopSuratUrl && (settings.tipeKopSurat === 'gambar' || !settings.tipeKopSurat) ? (
              <div className="w-full text-center pb-2 border-b-2 border-black mb-3">
                <img
                  src={settings.kopSuratUrl}
                  alt="KOP Surat Resmi"
                  className="w-full object-contain max-h-36 mx-auto print:max-h-32"
                />
              </div>
            ) : (
              <div className="text-center pb-2 border-b-2 border-black relative">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  {settings?.kopPemerintah || 'Pemerintah Kabupaten Bondowoso'}
                </h4>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {settings?.kopDinas || 'Dinas Pendidikan dan Kebudayaan'}
                </h3>
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-950 mt-0.5">
                  {settings?.kopSekolah || settings?.namaSekolah || 'UPTD SPF SD NEGERI LANAS 1'}
                </h2>
                <p className="text-[10px] text-slate-600">
                  {settings?.kopAlamat || settings?.alamatLengkap || 'Desa Lanas, Kec. Botolinggo, Kabupaten Bondowoso, Jawa Timur'} • {settings?.kopKontak || `Kode Pos ${settings?.kodePos || '68284'}`}
                </p>
                {/* Garis Ganda Kop */}
                <div className="border-b border-black mt-1"></div>
              </div>
            )}

            {/* JUDUL DOKUMEN */}
            <div className="text-center my-4">
              <h2 className="text-sm sm:text-base font-bold uppercase text-slate-950 tracking-wide">
                {title}
              </h2>
              <p className="text-xs text-slate-600">
                Keadaan: <span className="font-semibold text-slate-900">{periodeName}</span>
              </p>
            </div>

            {/* TABEL DATA RESMI DUK */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-100 text-center font-bold text-slate-950">
                    <th className="border border-black p-1.5 w-8">No</th>
                    <th className="border border-black p-1.5 text-left">Nama Pegawai & NIP</th>
                    <th className="border border-black p-1.5">Tempat & Tgl Lahir / JK</th>
                    <th className="border border-black p-1.5">Pangkat / Gol. Ruang</th>
                    <th className="border border-black p-1.5">TMT Pangkat</th>
                    <th className="border border-black p-1.5 text-left">Jabatan</th>
                    <th className="border border-black p-1.5">TMT Jabatan</th>
                    <th className="border border-black p-1.5 bg-amber-50 print:bg-amber-50">TMT di Sekolah Ini</th>
                    <th className="border border-black p-1.5">Masa Kerja (Gol / Total)</th>
                    <th className="border border-black p-1.5 text-left">Pendidikan Terakhir</th>
                    <th className="border border-black p-1.5">Ket.</th>
                  </tr>
                  <tr className="bg-slate-50 text-center text-[9px] text-slate-500 font-mono">
                    <th className="border border-black py-0.5">1</th>
                    <th className="border border-black py-0.5">2</th>
                    <th className="border border-black py-0.5">3</th>
                    <th className="border border-black py-0.5">4</th>
                    <th className="border border-black py-0.5">5</th>
                    <th className="border border-black py-0.5">6</th>
                    <th className="border border-black py-0.5">7</th>
                    <th className="border border-black py-0.5">8</th>
                    <th className="border border-black py-0.5">9</th>
                    <th className="border border-black py-0.5">10</th>
                    <th className="border border-black py-0.5">11</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const e = item.employee;
                    return (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="border border-black p-1.5 text-center font-bold">{item.noUrut}</td>
                        <td className="border border-black p-1.5">
                          <p className="font-bold text-slate-950">
                            {e.gelarDepan ? `${e.gelarDepan} ` : ''}{e.namaLengkap}{e.gelarBelakang ? `, ${e.gelarBelakang}` : ''}
                          </p>
                          <p className="font-mono text-[9px] text-slate-600">NIP. {e.nip || '-'}</p>
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          {e.tempatLahir}, {formatTanggalSingkat(e.tanggalLahir)} ({e.jenisKelamin})
                        </td>
                        <td className="border border-black p-1.5 text-center font-semibold">
                          {item.pangkatGolonganText}
                        </td>
                        <td className="border border-black p-1.5 text-center font-mono">
                          {item.tmtPangkatFormatted}
                        </td>
                        <td className="border border-black p-1.5">
                          <p className="font-medium text-slate-900">{item.jabatanFormatted}</p>
                          {e.jabatanTambahan && (
                            <p className="text-[9px] text-slate-500 italic">Tgs: {e.jabatanTambahan}</p>
                          )}
                        </td>
                        <td className="border border-black p-1.5 text-center font-mono">
                          {item.tmtJabatanFormatted}
                        </td>
                        <td className="border border-black p-1.5 text-center font-bold bg-amber-50/50 print:bg-transparent font-mono">
                          {item.tmtSekolahFormatted}
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          <div>Gol: {item.mkGolonganFormatted}</div>
                          <div className="text-[9px] text-slate-500">Tot: {item.mkKeseluruhanFormatted}</div>
                        </td>
                        <td className="border border-black p-1.5">
                          <div>{item.pendidikanFormatted}</div>
                          <div className="text-[9px] text-slate-500">Lulus: {e.tahunLulus || '-'}</div>
                        </td>
                        <td className="border border-black p-1.5 text-center text-[9px]">
                          {e.keterangan || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* RUANG TANDA TANGAN KEPALA SEKOLAH */}
            <div className="flex justify-end mt-8 mr-4 print:mt-12 break-inside-avoid">
              <div className="text-left w-68 text-xs">
                <p>Bondowoso, {todayStr}</p>
                <p className="font-medium">Kepala UPTD SPF SD Negeri Lanas 1</p>
                <div className="h-18"></div>
                <p className="font-bold underline text-slate-950">
                  {settings?.namaKepalaSekolah || 'SAHWANTO, S.Pd.'}
                </p>
                <p className="text-[11px] text-slate-700">
                  {settings?.pangkatKepalaSekolah || 'Pembina, IV/a'}
                </p>
                <p className="text-[11px] font-mono text-slate-700">
                  NIP. {settings?.nipKepalaSekolah || '19680512 199303 1 008'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
