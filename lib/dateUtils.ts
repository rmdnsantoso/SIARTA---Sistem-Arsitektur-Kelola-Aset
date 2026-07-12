// ─────────────────────────────────────────
// Utilities untuk parsing tanggal (khususnya format bahasa Indonesia)
// ─────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5,
  'Jul': 6, 'Agu': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11
};

/**
 * Parsing string tanggal seperti "12 Jul 2026, 17:00 WIB" atau "12 Jun 2026"
 * Mengembalikan Date object.
 */
export function parseIndonesianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    // Menghapus 'WIB' dan bagian setelah koma jika ada
    // Format 1: "12 Jul 2026, 17:00 WIB"
    // Format 2: "12 Jun 2026"
    
    // Pecah berdasarkan koma
    const parts = dateStr.split(',');
    const datePart = parts[0].trim(); // "12 Jul 2026"
    const timePart = parts[1] ? parts[1].replace('WIB', '').trim() : '23:59'; // Default ke akhir hari
    
    const [dayStr, monthStr, yearStr] = datePart.split(' ');
    const day = parseInt(dayStr, 10);
    const month = MONTH_MAP[monthStr];
    const year = parseInt(yearStr, 10);
    
    if (isNaN(day) || month === undefined || isNaN(year)) {
      return null;
    }
    
    const [hourStr, minStr] = timePart.split(':');
    const hour = parseInt(hourStr, 10) || 0;
    const min = parseInt(minStr, 10) || 0;
    
    return new Date(year, month, day, hour, min, 0);
  } catch (e) {
    return null;
  }
}

/**
 * Mengecek apakah tanggalKembali sudah terlewati.
 * Digunakan untuk tiket dengan status 'Dipinjam'.
 */
export function isOverdue(tanggalKembali: string): boolean {
  const targetDate = parseIndonesianDate(tanggalKembali);
  if (!targetDate) return false;
  
  return targetDate.getTime() < Date.now();
}
