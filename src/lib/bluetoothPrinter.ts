import { EscPosBuilder, PaperSize } from './escpos';
import { StoreSettings } from '../types';

export interface PrinterDeviceState {
  connected: boolean;
  deviceName: string | null;
  deviceId: string | null;
  connecting: boolean;
  error: string | null;
  paperSize: PaperSize;
  autoPrint: boolean;
  openDrawer: boolean;
}

export interface POSCartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  subtotal: number;
}

export interface POSTransaction {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  cashierName: string;
  items: POSCartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'Tunai' | 'QRIS' | 'Transfer Bank' | 'Debit';
  cashReceived: number;
  change: number;
  notes?: string;
}

// Known common thermal printer GATT service UUIDs (standard and vendor-specific)
const THERMAL_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / Common transparent BLE UART
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART service
  '0000e781-0000-1000-8000-00805f9b34fb',
  '0000af30-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  0x18f0,
  0xffe0,
  0xff00,
  0xfff0
];

class BluetoothPrinterService {
  private device: any = null;
  private server: any = null;
  private characteristic: any = null;
  private listeners: ((state: PrinterDeviceState) => void)[] = [];

  private state: PrinterDeviceState = {
    connected: false,
    deviceName: localStorage.getItem('pos_printer_name') || null,
    deviceId: null,
    connecting: false,
    error: null,
    paperSize: (localStorage.getItem('pos_paper_size') as PaperSize) || '58mm',
    autoPrint: localStorage.getItem('pos_auto_print') !== 'false',
    openDrawer: localStorage.getItem('pos_open_drawer') === 'true'
  };

  constructor() {
    // Attempt to retain last state
  }

  public getState(): PrinterDeviceState {
    return { ...this.state };
  }

  public subscribe(listener: (state: PrinterDeviceState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach(l => l(currentState));
  }

  public setPaperSize(size: PaperSize) {
    this.state.paperSize = size;
    localStorage.setItem('pos_paper_size', size);
    this.notify();
  }

  public setAutoPrint(auto: boolean) {
    this.state.autoPrint = auto;
    localStorage.setItem('pos_auto_print', auto ? 'true' : 'false');
    this.notify();
  }

  public setOpenDrawer(open: boolean) {
    this.state.openDrawer = open;
    localStorage.setItem('pos_open_drawer', open ? 'true' : 'false');
    this.notify();
  }

  /** Check if Web Bluetooth API is supported by the client browser */
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /** Check if running inside an iframe where Bluetooth may require new window */
  public isInIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  /** Check if Web Bluetooth API is disallowed by Permissions Policy or sandboxed in iframe */
  public isDisallowedByPolicy(): boolean {
    if (typeof document !== 'undefined') {
      const doc = document as any;
      try {
        if (doc.permissionsPolicy && typeof doc.permissionsPolicy.allowsFeature === 'function') {
          if (!doc.permissionsPolicy.allowsFeature('bluetooth')) {
            return true;
          }
        }
      } catch (e) {}
      try {
        if (doc.featurePolicy && typeof doc.featurePolicy.allowsFeature === 'function') {
          if (!doc.featurePolicy.allowsFeature('bluetooth')) {
            return true;
          }
        }
      } catch (e) {}
    }
    return this.isInIframe();
  }

  /**
   * Connect to Bluetooth Thermal Printer using Web Bluetooth API
   */
  public async connect(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isSupported()) {
      const err = 'Browser Anda tidak mendukung Web Bluetooth API. Gunakan Google Chrome atau Microsoft Edge.';
      this.state.error = err;
      this.notify();
      return { success: false, error: err };
    }

    // Proactively check if iframe permissions policy blocks Bluetooth access
    if (this.isDisallowedByPolicy()) {
      const policyMsg = 'Akses Bluetooth dibatasi di dalam frame preview browser. Silakan klik "Buka Aplikasi di Tab Baru" di atas untuk menghubungkan printer secara langsung.';
      console.warn('Pemberitahuan: Akses Bluetooth dibatasi dalam frame preview browser. Buka aplikasi di Tab Baru untuk menghubungkan printer.');
      this.state.connected = false;
      this.state.connecting = false;
      this.state.error = policyMsg;
      this.notify();
      return { success: false, error: policyMsg };
    }

    this.state.connecting = true;
    this.state.error = null;
    this.notify();

    try {
      // Prompt user to select bluetooth printer
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: THERMAL_PRINTER_SERVICES
      });

      if (!device) {
        throw new Error('Tidak ada perangkat printer yang dipilih.');
      }

      this.device = device;
      device.addEventListener('gattserverdisconnected', () => {
        console.warn('Printer Bluetooth terputus');
        this.characteristic = null;
        this.server = null;
        this.state.connected = false;
        this.state.connecting = false;
        this.notify();
      });

      console.log('Connecting to GATT Server on:', device.name);
      const server = await device.gatt.connect();
      this.server = server;

      // Find primary service and writable characteristic
      let writeChar: any = null;

      // Try iterating through known services
      for (const serviceId of THERMAL_PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceId);
          if (service) {
            const characteristics = await service.getCharacteristics();
            for (const c of characteristics) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                writeChar = c;
                console.log('Found writable characteristic in service:', serviceId, c.uuid);
                break;
              }
            }
          }
        } catch (e) {
          // Continue scanning other services
        }
        if (writeChar) break;
      }

      // If not found in known list, try getPrimaryServices() directly
      if (!writeChar) {
        try {
          const allServices = await server.getPrimaryServices();
          for (const s of allServices) {
            try {
              const chars = await s.getCharacteristics();
              for (const c of chars) {
                if (c.properties.write || c.properties.writeWithoutResponse) {
                  writeChar = c;
                  console.log('Found writable characteristic in general scan:', s.uuid, c.uuid);
                  break;
                }
              }
            } catch (e) {}
            if (writeChar) break;
          }
        } catch (e) {}
      }

      if (!writeChar) {
        throw new Error('Perangkat terhubung namun tidak ditemukan kanal pengiriman data printer (ESC/POS Characteristic). Pastikan perangkat adalah printer thermal Bluetooth aktif.');
      }

      this.characteristic = writeChar;
      this.state.connected = true;
      this.state.connecting = false;
      this.state.deviceName = device.name || 'Thermal Bluetooth Printer';
      this.state.deviceId = device.id;
      this.state.error = null;

      localStorage.setItem('pos_printer_name', this.state.deviceName);
      this.notify();

      return { success: true, deviceName: this.state.deviceName };
    } catch (err: any) {
      let errMsg = err?.message || 'Gagal menghubungkan printer Bluetooth.';
      const isPolicyRestriction = err?.name === 'SecurityError' ||
        errMsg.includes('permissions policy') ||
        errMsg.includes('disallowed');

      if (isPolicyRestriction) {
        console.warn('Akses Bluetooth dibatasi oleh izin frame preview browser. Buka aplikasi di tab baru.');
        errMsg = 'Izin Bluetooth dibatasi oleh frame browser. Silakan klik tombol "Buka di Tab Baru" di atas untuk menghubungkan printer secara langsung.';
      } else if (err?.name === 'NotFoundError') {
        console.info('Pencarian Bluetooth dibatalkan oleh pengguna.');
        errMsg = 'Pencarian dibatalkan atau tidak ada printer yang dipilih.';
      } else {
        console.warn('Pemberitahuan koneksi Bluetooth:', errMsg);
      }

      this.state.connected = false;
      this.state.connecting = false;
      this.state.error = errMsg;
      this.notify();
      return { success: false, error: errMsg };
    }
  }

  /**
   * Disconnect the Bluetooth printer
   */
  public disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      try {
        this.device.gatt.disconnect();
      } catch (e) {
        console.error('Error disconnecting:', e);
      }
    }
    this.characteristic = null;
    this.server = null;
    this.state.connected = false;
    this.state.connecting = false;
    this.notify();
  }

  /**
   * Raw write ESC/POS bytes through the active Bluetooth GATT Characteristic with chunking
   */
  public async sendBytes(data: Uint8Array): Promise<{ success: boolean; error?: string }> {
    if (!this.state.connected || !this.characteristic) {
      return {
        success: false,
        error: 'Printer Bluetooth belum terhubung. Silakan hubungkan printer terlebih dahulu.'
      };
    }

    try {
      // Typical BLE GATT packet MTU constraint is 20-64 bytes
      const CHUNK_SIZE = 32;
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        if (this.characteristic.writeValueWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else if (this.characteristic.writeValue) {
          await this.characteristic.writeValue(chunk);
        } else if (this.characteristic.writeValueWithResponse) {
          await this.characteristic.writeValueWithResponse(chunk);
        }
        // Small delay (20ms) to ensure micro thermal printer buffers don't overflow
        await new Promise(res => setTimeout(res, 20));
      }

      return { success: true };
    } catch (err: any) {
      console.error('Failed sending ESC/POS bytes to Bluetooth printer:', err);
      return { success: false, error: err.message || 'Gagal mengirim data ke printer Bluetooth.' };
    }
  }

  /**
   * Helper to format currency IDR
   */
  private formatRupiah(num: number): string {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  }

  /**
   * Generate ESC/POS Binary Receipt for a transaction
   */
  public buildTransactionReceipt(
    tx: POSTransaction,
    settings: StoreSettings
  ): Uint8Array {
    const builder = new EscPosBuilder(this.state.paperSize);

    // 1. Store Header
    builder
      .align('center')
      .size('double-h')
      .bold(true)
      .line(settings.store_name || 'SALIN SERUPA')
      .size('normal')
      .bold(false);

    if (settings.address) {
      // Split address if too long
      const addr = settings.address.length > 32 ? settings.address.slice(0, 32) : settings.address;
      builder.line(addr);
    }
    if (settings.whatsapp) {
      builder.line(`WA: ${settings.whatsapp}`);
    }

    builder.divider('-');

    // 2. Transaction Metadata
    builder
      .align('left')
      .twoColumns('No. Nota', tx.orderNumber)
      .twoColumns('Tanggal', tx.createdAt.replace('T', ' ').slice(0, 16))
      .twoColumns('Kasir', tx.cashierName || 'Admin')
      .twoColumns('Pelanggan', tx.customerName || 'Pelanggan Langsung')
      .twoColumns('Metode', tx.paymentMethod);

    builder.divider('-');

    // 3. Items List
    builder.bold(true).twoColumns('ITEM PRODUK', 'TOTAL').bold(false);

    tx.items.forEach(item => {
      // Item Name
      builder.bold(true).line(item.name).bold(false);
      // Qty x Price and Subtotal
      const qtyPrice = `  ${item.quantity} x Rp ${this.formatRupiah(item.price)}`;
      const sub = `Rp ${this.formatRupiah(item.subtotal)}`;
      builder.twoColumns(qtyPrice, sub);

      if (item.notes) {
        builder.line(`  * ${item.notes}`);
      }
    });

    builder.divider('-');

    // 4. Totals & Payment Summary
    builder
      .twoColumns('Subtotal', `Rp ${this.formatRupiah(tx.subtotal)}`);

    if (tx.discount > 0) {
      builder.twoColumns('Diskon', `-Rp ${this.formatRupiah(tx.discount)}`);
    }
    if (tx.tax > 0) {
      builder.twoColumns('Pajak (PPN)', `Rp ${this.formatRupiah(tx.tax)}`);
    }

    builder
      .bold(true)
      .size('double-h')
      .twoColumns('TOTAL', `Rp ${this.formatRupiah(tx.total)}`)
      .size('normal')
      .bold(false);

    if (tx.paymentMethod === 'Tunai') {
      builder
        .twoColumns('Tunai Diterima', `Rp ${this.formatRupiah(tx.cashReceived)}`)
        .bold(true)
        .twoColumns('KEMBALIAN', `Rp ${this.formatRupiah(tx.change)}`)
        .bold(false);
    } else {
      builder.twoColumns('Status Bayar', 'LUNAS');
    }

    builder.divider('=');

    // 5. Footer & Politeness
    builder
      .align('center')
      .line('Terima Kasih Atas Kunjungan Anda!')
      .line('Barang yang sudah dibeli')
      .line('tidak dapat ditukar / dikembalikan')
      .line('Layanan Percetakan Cepat & Berkualitas');

    // Optional Open Cash Drawer
    if (this.state.openDrawer && tx.paymentMethod === 'Tunai') {
      builder.openCashDrawer();
    }

    builder.cut();
    return builder.getBuffer();
  }

  /**
   * Generate ESC/POS Binary Diagnostic Test Receipt
   */
  public buildTestReceipt(settings: StoreSettings): Uint8Array {
    const builder = new EscPosBuilder(this.state.paperSize);

    builder
      .align('center')
      .size('double-h')
      .bold(true)
      .line('*** TEST PRINT ***')
      .size('normal')
      .line(settings.store_name || 'SALIN SERUPA')
      .divider('=')
      .align('left')
      .bold(true)
      .line('DRIVER STATUS: AKTIF')
      .bold(false)
      .twoColumns('Device', this.state.deviceName || 'Thermal BT Printer')
      .twoColumns('Format Kertas', this.state.paperSize)
      .twoColumns('Waktu Uji', new Date().toLocaleTimeString('id-ID'))
      .divider('-')
      .align('center')
      .line('PENGUJIAN PERATAAN:')
      .align('left')
      .line('[<- Rata Kiri]')
      .align('center')
      .line('[Rata Tengah]')
      .align('right')
      .line('[Rata Kanan ->]')
      .align('left')
      .divider('-')
      .line('Karakter: 0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ')
      .divider('=')
      .align('center')
      .bold(true)
      .line('Koneksi Bluetooth Berhasil!')
      .line('Driver Siap Digunakan untuk POS.')
      .bold(false)
      .cut();

    return builder.getBuffer();
  }

  /**
   * Print transaction via connected Bluetooth printer
   */
  public async printTransaction(
    tx: POSTransaction,
    settings: StoreSettings
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.state.connected) {
      return {
        success: false,
        error: 'Printer Bluetooth belum terhubung. Silakan pasangkan perangkat printer Anda.'
      };
    }

    const bytes = this.buildTransactionReceipt(tx, settings);
    return await this.sendBytes(bytes);
  }

  /**
   * Print test receipt via connected Bluetooth printer
   */
  public async printTest(settings: StoreSettings): Promise<{ success: boolean; error?: string }> {
    if (!this.state.connected) {
      return {
        success: false,
        error: 'Printer Bluetooth belum terhubung. Silakan pasangkan perangkat printer Anda.'
      };
    }

    const bytes = this.buildTestReceipt(settings);
    return await this.sendBytes(bytes);
  }

  /**
   * Fallback System Thermal Print (for USB printer, Desktop, or if Bluetooth is unavailable)
   */
  public printThermalViaBrowser(tx: POSTransaction, settings: StoreSettings) {
    const widthMm = this.state.paperSize === '80mm' ? '80mm' : '58mm';
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('Popup diblokir oleh browser. Izinkan popup untuk mencetak struk.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk POS ${tx.orderNumber}</title>
        <style>
          @page {
            size: ${widthMm} auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.35;
            color: #000;
            background: #fff;
            width: ${widthMm};
            margin: 0 auto;
            padding: 8px 6px;
            box-sizing: border-box;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .title { font-size: 15px; font-weight: bold; margin-bottom: 2px; }
          .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-bottom: 2px solid #000; margin: 6px 0; }
          .flex { display: flex; justify-content: space-between; }
          .item-row { margin-bottom: 4px; }
          .total-row { font-size: 14px; font-weight: bold; margin-top: 4px; }
          @media print {
            body { width: 100%; padding: 4px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">${settings.store_name || 'SALIN SERUPA'}</div>
          ${settings.address ? `<div>${settings.address}</div>` : ''}
          ${settings.whatsapp ? `<div>WA: ${settings.whatsapp}</div>` : ''}
        </div>
        <div class="divider"></div>
        <div class="flex"><span>No. Nota:</span><span class="bold">${tx.orderNumber}</span></div>
        <div class="flex"><span>Tanggal:</span><span>${tx.createdAt.replace('T', ' ').slice(0, 16)}</span></div>
        <div class="flex"><span>Kasir:</span><span>${tx.cashierName}</span></div>
        <div class="flex"><span>Pelanggan:</span><span>${tx.customerName}</span></div>
        <div class="flex"><span>Metode:</span><span>${tx.paymentMethod}</span></div>
        <div class="divider"></div>
        <div class="bold" style="margin-bottom: 4px;">ITEM BELANJA</div>
        ${tx.items.map(it => `
          <div class="item-row">
            <div class="bold">${it.name}</div>
            <div class="flex">
              <span>&nbsp;&nbsp;${it.quantity} x Rp ${this.formatRupiah(it.price)}</span>
              <span>Rp ${this.formatRupiah(it.subtotal)}</span>
            </div>
            ${it.notes ? `<div style="font-size: 10px; padding-left: 8px;">* ${it.notes}</div>` : ''}
          </div>
        `).join('')}
        <div class="divider"></div>
        <div class="flex"><span>Subtotal:</span><span>Rp ${this.formatRupiah(tx.subtotal)}</span></div>
        ${tx.discount > 0 ? `<div class="flex"><span>Diskon:</span><span>-Rp ${this.formatRupiah(tx.discount)}</span></div>` : ''}
        ${tx.tax > 0 ? `<div class="flex"><span>PPN:</span><span>Rp ${this.formatRupiah(tx.tax)}</span></div>` : ''}
        <div class="divider"></div>
        <div class="flex total-row">
          <span>TOTAL:</span>
          <span>Rp ${this.formatRupiah(tx.total)}</span>
        </div>
        ${tx.paymentMethod === 'Tunai' ? `
          <div class="flex" style="margin-top: 4px;"><span>Tunai:</span><span>Rp ${this.formatRupiah(tx.cashReceived)}</span></div>
          <div class="flex bold"><span>Kembalian:</span><span>Rp ${this.formatRupiah(tx.change)}</span></div>
        ` : `
          <div class="flex" style="margin-top: 4px;"><span>Status:</span><span class="bold">LUNAS</span></div>
        `}
        <div class="double-divider"></div>
        <div class="text-center" style="font-size: 10px; margin-top: 6px;">
          <div>Terima Kasih Atas Kunjungan Anda!</div>
          <div>Barang yang dibeli tidak dapat ditukar</div>
          <div>Layanan Percetakan Cepat & Berkualitas</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();
