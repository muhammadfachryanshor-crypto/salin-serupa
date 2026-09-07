import { CartItem, Order } from './types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Calculate open status based on Asia/Jakarta timezone
export function checkStoreOpenStatus(weekdaysHours: string = '09:00 - 21:00', sundayHours: string = '09:00 - 20:30'): { isOpen: boolean; text: string } {
  try {
    // Current time in WIB (UTC+7)
    const now = new Date();
    const jakartaTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
    const jakartaDate = new Date(jakartaTimeStr);

    const dayOfWeek = jakartaDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const currentHour = jakartaDate.getHours();
    const currentMinute = jakartaDate.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const hoursRange = dayOfWeek === 0 ? sundayHours : weekdaysHours;
    // Extract times e.g. "09:00 - 21:00"
    const match = hoursRange.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
    if (!match) {
      return { isOpen: true, text: `Buka Hari Ini • ${hoursRange}` };
    }

    const startMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    const endMinutes = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);

    const isOpen = currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes;
    const text = isOpen ? `Buka Hari Ini • ${hoursRange}` : `Tutup • Buka Kembali ${dayOfWeek === 6 ? 'Besok 09:00' : '09:00 WIB'}`;

    return { isOpen, text };
  } catch (err) {
    return { isOpen: true, text: 'Buka Hari Ini • 09:00 - 21:00 WIB' };
  }
}

// Build WhatsApp Order Link formatted neatly
export function generateWhatsAppOrderUrl(
  waNumber: string,
  customerName: string,
  customerWa: string,
  items: CartItem[],
  total: number,
  notes: string,
  pickupMethod: string
): string {
  const cleanWaNumber = waNumber.replace(/[^0-9]/g, '');
  
  const itemListText = items.length > 0
    ? items
        .map(i => `- ${i.product.name} x ${i.quantity} = ${formatRupiah((i.product.promo_price || i.product.price) * i.quantity)}`)
        .join('\n')
    : '- (Order Dokumen / Cetak)';

  const message = `Halo Fotokopi Salin Serupa, saya ingin melakukan pemesanan.

Nama: ${customerName || '-'}
WhatsApp: ${customerWa || '-'}

Pesanan:
${itemListText}

Total: ${formatRupiah(total)}

Catatan:
${notes || 'Tidak ada'}

Metode Pengambilan:
${pickupMethod || 'Ambil di toko'}

📌 Dokumen yang ingin diprint akan saya kirim langsung di chat WhatsApp ini.

Terima kasih.`;

  return `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(message)}`;
}

// Build WhatsApp Direct Inquiry Link
export function generateWhatsAppInquiryUrl(waNumber: string, customMessage?: string): string {
  const cleanWaNumber = waNumber.replace(/[^0-9]/g, '');
  const msg = customMessage || 'Halo Fotokopi Salin Serupa, saya ingin bertanya mengenai layanan/produk.';
  return `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(msg)}`;
}

// Build WhatsApp Status Update Notification Link for Buyers
export function generateWhatsAppStatusUpdateUrl(
  customerWa: string,
  customerName: string,
  orderId: string,
  status: string
): string {
  const cleanWaNumber = customerWa.replace(/[^0-9]/g, '');
  let statusDetail = '';
  switch (status) {
    case 'Diproses':
      statusDetail = 'Dokumen / barang Anda sedang dalam proses pencetakan & pengerjaan.';
      break;
    case 'Siap Diambil':
      statusDetail = 'Pesanan Anda sudah selesai dicetak dan SIAP untuk diambil di toko kami (atau siap dikirim).';
      break;
    case 'Selesai':
      statusDetail = 'Terima kasih, transaksi pesanan Anda telah SELESAI. Senang melayani Anda!';
      break;
    case 'Dibatalkan':
      statusDetail = 'Pesanan Anda telah dibatalkan. Hubungi kami jika ada pertanyaan.';
      break;
    default:
      statusDetail = 'Pesanan Anda telah diterima dan masuk antrean.';
  }

  const message = `Halo Kak ${customerName || ''},

Update status pesanan Anda di *Fotokopi Salin Serupa*:
📌 *No. Order*: ${orderId}
📊 *Status Terbaru*: *${status.toUpperCase()}*

${statusDetail}

Anda juga dapat melacak progress pesanan kapan saja di website kami dengan memasukkan nomor transaksi ${orderId}.

Terima kasih! 🙏`;

  return `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(message)}`;
}

// Export Orders to CSV Download
export function exportOrdersToCSV(orders: Order[], filename: string = 'Laporan_Penjualan_Salin_Serupa.csv'): void {
  if (!orders || orders.length === 0) {
    alert('Tidak ada data pesanan untuk diekspor.');
    return;
  }

  const headers = ['No. Order', 'Tanggal & Waktu', 'Nama Pelanggan', 'WhatsApp', 'Metode Pengambilan', 'Subtotal', 'Total (Rp)', 'Status', 'Catatan', 'Item Dipesan'];
  
  const rows = orders.map(o => {
    const dateFormatted = new Date(o.created_at).toLocaleString('id-ID');
    const itemsFormatted = o.items.map(i => `${i.product_name} (${i.quantity}x)`).join('; ');
    const safeName = `"${(o.customer_name || '').replace(/"/g, '""')}"`;
    const safeWa = `"${(o.whatsapp || '').replace(/"/g, '""')}"`;
    const safePickup = `"${(o.pickup_method || '').replace(/"/g, '""')}"`;
    const safeNotes = `"${(o.notes || '').replace(/"/g, '""')}"`;
    const safeItems = `"${itemsFormatted.replace(/"/g, '""')}"`;

    return [
      o.id,
      `"${dateFormatted}"`,
      safeName,
      safeWa,
      safePickup,
      o.subtotal || o.total,
      o.total,
      o.status,
      safeNotes,
      safeItems
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

