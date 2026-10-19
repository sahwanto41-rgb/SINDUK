/**
 * Utilitas untuk kompresi dan optimasi gambar KOP Surat resmi
 * Memastikan gambar tajam untuk cetak A4 Landscape namun hemat penyimpanan Firestore (<250 KB)
 */
export async function compressKopImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Berkas yang dipilih harus berupa gambar (PNG, JPG, atau WEBP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar KOP surat.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Browser tidak mendukung pemrosesan gambar canvas.'));
            return;
          }

          // Target lebar ideal untuk A4 Landscape (1400px cukup tajam untuk cetak resolusi tinggi)
          const MAX_WIDTH = 1400;
          const MAX_HEIGHT = 380;

          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;

          // Background putih jika format transparan ingin dicetak bersih
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Gambar KOP surat
          ctx.drawImage(img, 0, 0, width, height);

          // Gunakan JPEG kualitas 0.88 untuk kompresi optimal tanpa pecah
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(dataUrl);
        } catch (err: any) {
          reject(new Error(`Gagal memproses gambar: ${err.message}`));
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
