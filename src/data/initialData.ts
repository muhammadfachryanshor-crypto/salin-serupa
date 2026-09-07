import { AppData } from '../types';

export const initialAppData: AppData = {
  settings: {
    id: 'store-1',
    store_name: 'Fotokopi Salin Serupa - Jakarta Utara',
    whatsapp: '+62 812-9229-0876',
    address: 'Jl. Empang Damai No.62, RT.10/RW.4, Kapuk Muara, Kecamatan Penjaringan, Jakarta Utara, Daerah Khusus Ibukota Jakarta 14460',
    latitude: -6.128765,
    longitude: 106.772543,
    maps_url: 'https://www.google.com/maps/search/?api=1&query=Jl.+Empang+Damai+No.62+RT.10%2FRW.4+Kapuk+Muara+Kecamatan+Penjaringan+Jakarta+Utara+14460',
    logo: '/icon.svg',
    favicon: '/icon.svg',
    meta_title: 'Fotokopi Salin Serupa - Jakarta Utara | Fotokopi, Printing & ATK',
    meta_description: 'Fotokopi Salin Serupa Jakarta Utara menyediakan layanan fotokopi, printing, scan, jilid, laminasi, percetakan dan berbagai kebutuhan ATK.',
    business_hours_weekdays: '09:00 - 21:00 WIB',
    business_hours_sunday: '09:00 - 20:30 WIB'
  },
  landing: {
    hero: {
      headline: 'Solusi Fotokopi, Printing & ATK Terlengkap di',
      headline_accent: 'Jakarta Utara',
      subheadline: 'Kami menyediakan layanan percetakan cepat, penjilidan profesional, dan berbagai kebutuhan alat tulis kantor untuk mahasiswa, profesional, dan bisnis lokal.',
      cta_primary: 'Pesan Sekarang',
      cta_secondary: 'Lihat Katalog',
      badge_text: 'Buka Hari Ini • 09:00 - 21:00',
      trust_text: 'Dipercaya oleh 1000+ pelanggan di Jakarta Utara',
      hero_image: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=1200&q=80',
      is_active: true
    },
    tentang: {
      title: 'Tentang Fotokopi Salin Serupa',
      description: 'Fotokopi Salin Serupa - Jakarta Utara hadir untuk membantu memenuhi berbagai kebutuhan fotokopi, printing, dokumen, dan alat tulis kantor bagi pelanggan pribadi, pelajar, mahasiswa, maupun kebutuhan bisnis.',
      image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
      cta_text: 'Hubungi Kami',
      is_active: true
    },
    keunggulan: [
      {
        id: 'k-1',
        icon: 'speed',
        title: 'Pelayanan Cepat',
        description: 'Mesin berkapasitas tinggi menjamin dokumen Anda selesai tepat waktu tanpa antri lama.',
        sort_order: 1,
        is_active: true
      },
      {
        id: 'k-2',
        icon: 'payments',
        title: 'Harga Terjangkau',
        description: 'Penawaran harga terbaik untuk partai besar maupun eceran, cocok untuk pelajar dan instansi.',
        sort_order: 2,
        is_active: true
      },
      {
        id: 'k-3',
        icon: 'inventory_2',
        title: 'Produk Lengkap',
        description: 'Mulai dari berbagai jenis kertas hingga ATK kantor terlengkap tersedia di toko kami.',
        sort_order: 3,
        is_active: true
      },
      {
        id: 'k-4',
        icon: 'location_on',
        title: 'Lokasi Strategis',
        description: 'Mudah diakses di pusat Kapuk Muara, Penjaringan, Jakarta Utara dengan area parkir memadai.',
        sort_order: 4,
        is_active: true
      }
    ]
  },
  services: [
    {
      id: 'srv-1',
      name: 'Fotokopi & Print B/W',
      description: 'Hasil tajam, cepat, dan rapi. Melayani berbagai ukuran kertas A4, F4, A3 hingga A0.',
      icon: 'file_copy',
      image: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80',
      badge: 'Paling Dicari',
      sort_order: 1,
      is_active: true
    },
    {
      id: 'srv-2',
      name: 'Print Warna',
      description: 'Kualitas tajam & warna cerah untuk dokumen tugas, presentasi, brosur, & poster.',
      icon: 'auto_awesome',
      sort_order: 2,
      is_active: true
    },
    {
      id: 'srv-3',
      name: 'Scan Dokumen',
      description: 'Resolusi tinggi s.d 600dpi, langsung ubah dokumen fisik menjadi PDF/JPEG.',
      icon: 'scanner',
      sort_order: 3,
      is_active: true
    },
    {
      id: 'srv-4',
      name: 'Jilid & Finishing',
      description: 'Softcover, Hardcover, Lakban, Spiral Kawat/Plastik, Laminasi Doff/Glossy.',
      icon: 'menu_book',
      sort_order: 4,
      is_active: true
    },
    {
      id: 'srv-5',
      name: 'Cetak Foto',
      description: 'Cetak foto ukuran pasfoto (2x3, 3x4, 4x6) hingga cetak bingkai dengan kertas foto premium.',
      icon: 'imagesmode',
      sort_order: 5,
      is_active: true
    },
    {
      id: 'srv-6',
      name: 'Percetakan',
      description: 'Brosur, Kartu Nama, Banner, Spanduk Flexi, Stiker Custom, dan Undangan.',
      icon: 'storefront',
      sort_order: 6,
      is_active: true
    },
    {
      id: 'srv-7',
      name: 'Laminasi Dokumen',
      description: 'Laminasi panas (hot lamination) untuk ijazah, sertifikat, ID Card, dan dokumen penting.',
      icon: 'layers',
      sort_order: 7,
      is_active: true
    },
    {
      id: 'srv-8',
      name: 'Kebutuhan Kantor & ATK',
      description: 'Penyediaan segala jenis alat tulis, kertas, map, pulpen, dan kebutuhan perlengkapan kantor.',
      icon: 'description',
      sort_order: 8,
      is_active: true
    }
  ],
  categories: [
    { id: 'cat-1', name: 'Kertas', slug: 'kertas', description: 'Kertas HVS, Buffalo, Photo, HVS Warna', sort_order: 1, is_active: true },
    { id: 'cat-2', name: 'ATK', slug: 'atk', description: 'Alat Tulis Kantor Dasar & Spesial', sort_order: 2, is_active: true },
    { id: 'cat-3', name: 'Buku', slug: 'buku', description: 'Buku Tulis, Buku Kas, Kwitansi, Ledger', sort_order: 3, is_active: true },
    { id: 'cat-4', name: 'Pulpen', slug: 'pulpen', description: 'Pulpen Gel, Ballpoint, Marker, Spidol', sort_order: 4, is_active: true },
    { id: 'cat-5', name: 'Pensil', slug: 'pensil', description: 'Pensil 2B, Mekanik, Penghapus, Rautan', sort_order: 5, is_active: true },
    { id: 'cat-6', name: 'Map', slug: 'map', description: 'Stopmap, Business File, Snelhecter, Binder', sort_order: 6, is_active: true },
    { id: 'cat-7', name: 'Folder', slug: 'folder', description: 'Folder Plastik, Document Bag, Odner', sort_order: 7, is_active: true },
    { id: 'cat-8', name: 'Printer & Tinta', slug: 'printer-tinta', description: 'Tinta Printer Epson, Canon, HP, Kertas Foto', sort_order: 8, is_active: true },
    { id: 'cat-9', name: 'Perlengkapan Kantor', slug: 'perlengkapan-kantor', description: 'Stapler, Lakban, Gunting, Pemotong Kertas', sort_order: 9, is_active: true },
    { id: 'cat-10', name: 'Produk Printing', slug: 'produk-printing', description: 'Jasa Print Warna, Fotokopi, Jilid Hardcover', sort_order: 10, is_active: true }
  ],
  products: [
    {
      id: 'prd-1',
      sku: 'KRT-A4-75',
      name: 'Kertas HVS A4 75gsm PaperOne',
      slug: 'kertas-hvs-a4-75gsm-paperone',
      category_id: 'cat-1',
      description: 'Kertas HVS putih bersih ukuran A4 gramatur 75gsm cocok untuk cetak dokumen & fotokopi.',
      price: 48000,
      promo_price: 45000,
      stock: 120,
      unit: 'Rim',
      image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-2',
      sku: 'KRT-F4-70',
      name: 'Kertas HVS F4 70gsm Sinar Dunia',
      slug: 'kertas-hvs-f4-70gsm-sinar-dunia',
      category_id: 'cat-1',
      description: 'Kertas HVS ukuran Folio/F4 70gsm standar untuk surat perizinan & laporan kerja.',
      price: 52000,
      stock: 85,
      unit: 'Rim',
      image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-3',
      sku: 'PLP-FST-C600',
      name: 'Pulpen Gel Faster C600 Hitam',
      slug: 'pulpen-gel-faster-c600-hitam',
      category_id: 'cat-4',
      description: 'Pulpen gel hitam lancar, mata pena 0.5mm anti macet cocok untuk tanda tangan dan menulis.',
      price: 3500,
      stock: 300,
      unit: 'Pcs',
      image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-4',
      sku: 'PLP-PLT-G2',
      name: 'Pulpen Pilot G2 0.5mm Black',
      slug: 'pulpen-pilot-g2-05mm-black',
      category_id: 'cat-4',
      description: 'Pulpen retractable gel berkualitas tinggi dengan rubber grip nyaman dipakai.',
      price: 18000,
      promo_price: 15500,
      stock: 60,
      unit: 'Pcs',
      image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-5',
      sku: 'PNS-FC-2B',
      name: 'Pensil 2B Faber-Castell Original',
      slug: 'pensil-2b-faber-castell-original',
      category_id: 'cat-5',
      description: 'Pensil 2B standar komputer OMR ujian nasional dan menggambar.',
      price: 5000,
      stock: 250,
      unit: 'Pcs',
      image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-6',
      sku: 'MAP-BF-A4',
      name: 'Map Business File A4 Plastik Bening',
      slug: 'map-business-file-a4-plastik-bening',
      category_id: 'cat-6',
      description: 'Map plastik penyimpan dokumen dengan pengunci snelhecter di dalamnya.',
      price: 4000,
      stock: 180,
      unit: 'Pcs',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-7',
      sku: 'MAP-STP-BFL',
      name: 'Stopmap Folio Buffalo Kertas Tebal',
      slug: 'stopmap-folio-buffalo-kertas-tebal',
      category_id: 'cat-6',
      description: 'Map kertas buffalo tebal warna biru / merah / hijau untuk pengarsipan arsip kantor.',
      price: 2500,
      stock: 400,
      unit: 'Pcs',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-8',
      sku: 'BKU-SDU-38',
      name: 'Buku Tulis SiDU 38 Lembar (1 Pack / 10 Buku)',
      slug: 'buku-tulis-sidu-38-lembar-pack',
      category_id: 'cat-3',
      description: 'Buku tulis garis halus isi 38 lembar merk Sinar Dunia untuk sekolah dan catatan.',
      price: 38000,
      promo_price: 34000,
      stock: 50,
      unit: 'Pack',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-9',
      sku: 'BKU-KWT-PPL',
      name: 'Buku Kwitansi Paperline Ukuran Sedang',
      slug: 'buku-kwitansi-paperline-ukuran-sedang',
      category_id: 'cat-3',
      description: 'Buku kwitansi bukti pembayaran dengan perforasi rapi dan kertas berkualitas.',
      price: 8500,
      stock: 75,
      unit: 'Pcs',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-10',
      sku: 'TNT-EPS-003',
      name: 'Tinta Printer Epson 003 Black Original',
      slug: 'tinta-printer-epson-003-black-original',
      category_id: 'cat-8',
      description: 'Tinta original Epson 003 botol 65ml untuk L3110, L3150, L5190 dll.',
      price: 95000,
      promo_price: 88000,
      stock: 30,
      unit: 'Botol',
      image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-11',
      sku: 'STP-KNG-HD10',
      name: 'Stapler Kangaro HD-10 + Isi Staples',
      slug: 'stapler-kangaro-hd-10-isi-staples',
      category_id: 'cat-9',
      description: 'Set pelubang/pengikat dokumen stapler sedang kuat dan awet.',
      price: 17500,
      stock: 90,
      unit: 'Set',
      image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-12',
      sku: 'LKB-CL-2IN',
      name: 'Lakban Bening Daimaru 2 Inch (48mm x 90m)',
      slug: 'lakban-bening-daimaru-2-inch',
      category_id: 'cat-9',
      description: 'Lakban bening ekstra rekat untuk pengemasan paket dan dokumen.',
      price: 14000,
      stock: 150,
      unit: 'Roll',
      image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-13',
      sku: 'JLD-HDC-SKR',
      name: 'Jilid Hardcover Skripsi Emboss Emas',
      slug: 'jilid-hardcover-skripsi-emboss-emas',
      category_id: 'cat-10',
      description: 'Jilid hardcover berkualitas tinggi untuk skripsi, tesis, disertasi dengan pita pembatas & tulisan emas.',
      price: 35000,
      promo_price: 28000,
      stock: 999,
      unit: 'Eksemplar',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-14',
      sku: 'JLD-LKB-A4',
      name: 'Jilid Lakban & Plastik Bening A4 / F4',
      slug: 'jilid-lakban-plastik-bening-a4-f4',
      category_id: 'cat-10',
      description: 'Jilid biasa lakban hitam dilapisi plastik bening / mika transparan depan belakang.',
      price: 5000,
      stock: 999,
      unit: 'Eksemplar',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-15',
      sku: 'JLD-SPR-KWT',
      name: 'Jilid Spiral Kawat A4 / F4 (Mika Bening)',
      slug: 'jilid-spiral-kawat-a4-f4',
      category_id: 'cat-10',
      description: 'Jilid kawat elegan cocok untuk makalah, modul presentasi kantor, dan kalender.',
      price: 12000,
      stock: 999,
      unit: 'Eksemplar',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-16',
      sku: 'PRT-CLR-A4',
      name: 'Print Dokumen Warna A4 (HVS 80gsm)',
      slug: 'print-dokumen-warna-a4',
      category_id: 'cat-10',
      description: 'Cetak warna tajam tinta original anti luntur untuk tugas sekolah & presentasi.',
      price: 1500,
      stock: 9999,
      unit: 'Lembar',
      image: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-17',
      sku: 'PRT-BW-A4',
      name: 'Fotokopi / Print Hitam Putih A4 (HVS 75gsm)',
      slug: 'fotokopi-print-hitam-putih-a4',
      category_id: 'cat-10',
      description: 'Cetak hitam putih cepat high speed laserjet tajam dan bersih.',
      price: 350,
      stock: 9999,
      unit: 'Lembar',
      image: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-18',
      sku: 'LMN-PRS-A4',
      name: 'Laminasi Pres Panas Dokumen A4 / F4',
      slug: 'laminasi-pres-panas-dokumen-a4-f4',
      category_id: 'cat-10',
      description: 'Pelindung dokumen plastik laminasi kedap air anti rusak.',
      price: 4000,
      stock: 999,
      unit: 'Lembar',
      image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-19',
      sku: 'CTK-FTO-4X6',
      name: 'Cetak Pasfoto 4x6 / 3x4 (Kertas Photo Glossy)',
      slug: 'cetak-pasfoto-4x6-3x4',
      category_id: 'cat-10',
      description: 'Cetak foto instan kualitas studio warna hidup tahan lama.',
      price: 2500,
      stock: 999,
      unit: 'Lembar',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'prd-20',
      sku: 'FDR-DOC-BAG',
      name: 'Folder Plastik Document Bag Resleting Folio',
      slug: 'folder-plastik-document-bag-resleting-folio',
      category_id: 'cat-7',
      description: 'Tas dokumen plastik resleting tebal kedap air penyimpan berkas.',
      price: 7500,
      stock: 110,
      unit: 'Pcs',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
      is_active: true
    }
  ],
  promotions: [
    {
      id: 'prm-1',
      title: 'Diskon Jilid Hardcover Skripsi',
      description: 'Potongan harga khusus jilid hardcover skripsi & tesis emboss pita emas.',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      normal_price: 35000,
      promo_price: 28000,
      start_date: '2026-08-01',
      end_date: '2026-09-30',
      is_active: true
    },
    {
      id: 'prm-2',
      title: 'Paket Kertas HVS A4 + Pulpen Gel Faster',
      description: 'Beli 1 Rim Kertas HVS A4 75gsm hemat bersama Pulpen Gel Faster C600.',
      image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80',
      normal_price: 51500,
      promo_price: 46000,
      start_date: '2026-08-15',
      end_date: '2026-09-15',
      is_active: true
    },
    {
      id: 'prm-3',
      title: 'Promo Cetak Brosur & Spanduk Usaha',
      description: 'Diskon khusus cetak spanduk flexi & brosur promosi UMKM Jakarta Utara.',
      image: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80',
      normal_price: 150000,
      promo_price: 125000,
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      is_active: true
    }
  ],
  testimonials: [
    {
      id: 'tst-1',
      customer_name: 'Budi Santoso',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      comment: 'Proses fotokopi dan jilid skripsi sangat cepat dan rapi. Penjual ramah dan hasilnya sangat memuaskan!',
      is_active: true,
      sort_order: 1
    },
    {
      id: 'tst-2',
      customer_name: 'Siti Aminah',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      comment: 'Cetak dokumen via pesan WhatsApp sangat praktis. Begitu nyampe toko barang sudah siap diambil tanpa perlu nunggu.',
      is_active: true,
      sort_order: 2
    },
    {
      id: 'tst-3',
      customer_name: 'PT. Maju Mundur (Bpk. Hendra)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      comment: 'Toko langganan untuk suplai kebutuhan ATK kantor kami di Kapuk Muara. Harga bersaing dan stok selalu lengkap.',
      is_active: true,
      sort_order: 3
    },
    {
      id: 'tst-4',
      customer_name: 'Kevin Wijaya',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      comment: 'Sangat terbantu karena buka sampai jam 9 malam. Pas butuh print dadakan malam-malam tetap dilayani dengan cepat.',
      is_active: true,
      sort_order: 4
    },
    {
      id: 'tst-5',
      customer_name: 'Ratna Sari',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
      rating: 5,
      comment: 'Hasil print warna dan cetak fotonya sangat tajam. Kertas foto tebal & mengkilap. Rekomended banget!',
      is_active: true,
      sort_order: 5
    }
  ],
  faqs: [
    {
      id: 'faq-1',
      question: 'Apakah bisa pesan melalui WhatsApp?',
      answer: 'Ya, Anda dapat memilih produk/layanan di katalog website dan menekan tombol "Checkout via WhatsApp" untuk mengirimkan rincian pesanan langsung ke nomor resmi kami.',
      sort_order: 1,
      is_active: true
    },
    {
      id: 'faq-2',
      question: 'Apakah bisa mengambil pesanan langsung di toko?',
      answer: 'Tentu saja! Anda bisa memilih metode pengambilan "Ambil di Toko" saat checkout sehingga pesanan Anda akan disiapkan terlebih dahulu.',
      sort_order: 2,
      is_active: true
    },
    {
      id: 'faq-3',
      question: 'Apa saja layanan cetak dokumen yang tersedia?',
      answer: 'Kami melayani Fotokopi B/W & Warna, Print Dokumen (A4, F4, A3), Scan Dokumen, Jilid Hardcover/Softcover/Spiral/Lakban, Laminasi, Cetak Foto, dan Cetak Banner/Brosur.',
      sort_order: 3,
      is_active: true
    },
    {
      id: 'faq-4',
      question: 'Berapa jam operasional Fotokopi Salin Serupa?',
      answer: 'Senin s.d Sabtu buka dari pukul 09:00 - 21:00 WIB, dan Minggu buka dari pukul 09:00 - 20:30 WIB.',
      sort_order: 4,
      is_active: true
    },
    {
      id: 'faq-5',
      question: 'Apakah menerima pesanan pengiriman via kurir instan?',
      answer: 'Ya, kami melayani pengiriman pesanan menggunakan GoSend / GrabExpress untuk wilayah Jakarta Utara dan sekitarnya.',
      sort_order: 5,
      is_active: true
    },
    {
      id: 'faq-6',
      question: 'Format file apa saja yang diterima untuk print?',
      answer: 'Kami menerima file format PDF, DOCX (Word), XLSX (Excel), PPTX (PowerPoint), JPG, PNG, dan CDR (CorelDraw). Kami menyarankan format PDF agar tata letak tidak berubah.',
      sort_order: 6,
      is_active: true
    },
    {
      id: 'faq-7',
      question: 'Apakah melayani pembelian ATK jumlah besar / grosir kantor?',
      answer: 'Ya, kami menyediakan penawaran harga khusus dan faktur penjualan untuk pembelian grosir instansi, sekolah, maupun perkantoran.',
      sort_order: 7,
      is_active: true
    },
    {
      id: 'faq-8',
      question: 'Di mana alamat toko Fotokopi Salin Serupa?',
      answer: 'Jl. Empang Damai No.62, RT.10/RW.4, Kapuk Muara, Kecamatan Penjaringan, Jakarta Utara 14460.',
      sort_order: 8,
      is_active: true
    }
  ],
  orders: [
    {
      id: 'ORD-092',
      customer_name: 'Budi Santoso',
      whatsapp: '081234567890',
      notes: 'Print warna kertas HVS 80gsm, tolong di jilid lakban bening.',
      pickup_method: 'Ambil di toko',
      subtotal: 150000,
      total: 150000,
      status: 'Diproses',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      items: [
        { id: 'item-1', product_id: 'prd-16', product_name: 'Print Dokumen Warna A4 (HVS 80gsm)', price: 1500, quantity: 100, subtotal: 150000 }
      ]
    },
    {
      id: 'ORD-091',
      customer_name: 'Siti Aminah',
      whatsapp: '085712345678',
      notes: 'Jilid hardcover skripsi warna biru tua emboss emas 2 rangkap.',
      pickup_method: 'Ambil di toko',
      subtotal: 85000,
      total: 85000,
      status: 'Selesai',
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      items: [
        { id: 'item-2', product_id: 'prd-13', product_name: 'Jilid Hardcover Skripsi Emboss Emas', price: 28000, quantity: 2, subtotal: 56000 },
        { id: 'item-3', product_id: 'prd-16', product_name: 'Print Dokumen Warna A4 (HVS 80gsm)', price: 1500, quantity: 20, subtotal: 29000 }
      ]
    },
    {
      id: 'ORD-090',
      customer_name: 'PT. Maju Mundur',
      whatsapp: '082198765432',
      notes: 'Kirim via GoSend instan, konfirmasi via WA dulu.',
      pickup_method: 'Pesanan sesuai kesepakatan',
      subtotal: 250000,
      total: 250000,
      status: 'Baru',
      created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      items: [
        { id: 'item-4', product_id: 'prd-1', product_name: 'Kertas HVS A4 75gsm PaperOne', price: 45000, quantity: 5, subtotal: 225000 },
        { id: 'item-5', product_id: 'prd-3', product_name: 'Pulpen Gel Faster C600 Hitam', price: 3500, quantity: 7, subtotal: 24500 }
      ]
    }
  ]
};
