import { IKMI_LOGO_URL } from '@/core/brand/assets'

export const defaultWebConfig = {
  landing_hero: {
    title: 'Membangun Daerah, Berkarya untuk Negeri.',
    subtitle: 'Ikatan Keluarga Mahasiswa Indramayu (IKMI) Se-Wilayah Cirebon. Wadah kolaborasi dan pengembangan diri bagi mahasiswa Indramayu untuk memberikan kontribusi nyata.',
    eyebrow: 'IKMI Se-Wilayah Cirebon',
    primaryCtaLabel: 'Lihat FAQ',
    primaryCtaHref: '/#faq',
    secondaryCtaLabel: 'Jelajahi Visi Misi',
    secondaryCtaHref: '/tentang-kami',
    pillarsLabel: 'Garis Besar Haluan IKMI',
    pillars: [
      { title: 'Intelektual', description: 'Peningkatan kapasitas akademik dan riset.' },
      { title: 'Solidaritas', description: 'Membangun keluarga besar yang menguatkan.' },
      { title: 'Kearifan', description: 'Menjaga identitas dan nilai daerah.' },
      { title: 'Kepedulian', description: 'Pengabdian langsung kepada masyarakat.' },
    ],
    slides: [
      { url: 'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210005/BPHU_rkqdtg.png', label: 'BPHU' },
      { url: 'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781225577/ChatGPT_Image_12_Jun_2026_07.49.13_wzkx4s.png', label: 'Kegiatan IKMI 1' },
      { url: 'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781228245/ChatGPT_Image_12_Jun_2026_08.31.44_bnzje5.png', label: 'Kegiatan IKMI 2' },
      { url: 'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781230548/psda_yufbw9.png', label: 'PSDA' },
      { url: 'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781230548/ekotif_rrhcnc.png', label: 'Ekotif' },
      { url: 'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781230578/komdigi_mht7vt.png', label: 'Komdigi' },
      { url: 'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781230723/hpm_wq8q4q.png', label: 'HPM' },
    ],
    departmentLogos: [
      'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210303/bph_n4damh.png',
      'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210299/kaderisasi_sfv6xl.png',
      'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210303/kajian_tf0phi.png',
      'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210292/psda_v78dor.png',
      'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210302/ekotif_urol9n.png',
      'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210301/komdigi_fl14rd.png',
      'https://res.cloudinary.com/dsgldeuuy/image/upload/v1781210301/hpm_lhvedv.png',
    ],
    stats: [
      { value: '128+', label: 'Anggota Aktif' },
      { value: '16', label: 'Program Kerja' },
      { value: '24', label: 'Publikasi' },
      { value: '6', label: 'Departemen' }
    ]
  },
  landing_about: {
    title: 'Memayu Ing Jagat',
    description: 'Kami hadir bukan sekadar sebagai organisasi kedaerahan, melainkan ruang bertumbuh. IKMI menyatukan mahasiswa Indramayu di Cirebon untuk menjadi penggerak kesadaran kritis, menjaga nilai historis, dan membangun jejaring yang berdampak positif bagi kemajuan daerah.',
    badges: ['Humanis', 'Akademis', 'Modern']
  },
  landing_sections: {
    aboutEyebrow: 'Tentang IKMI',
    aboutImageUrl: '',
    aboutImageAlt: 'Logo IKMI Cirebon',
    aboutBadgeLabel: 'Est. 2020',
    aboutLinkLabel: 'Baca Sejarah Lengkap IKMI',
    structureEyebrow: 'Pengurus Pusat',
    structureTitle: 'Mengenal Kabinet',
    structureAccent: 'Sri Nawikasa',
    structureButtonLabel: 'Lihat Struktur Organisasi',
    agendaEyebrow: 'Jejak Langkah',
    agendaTitle: 'Aksi Nyata & Agenda Kami',
    agendaDescription: 'Pantau pergerakan organisasi melalui program kerja dan kegiatan terdekat.',
    agendaStatusLabel: 'Segera',
    agendaButtonLabel: 'Lihat Kalender Lengkap',
    agendaEmptyText: 'Belum ada agenda terdekat.',
    blogEyebrow: 'Ruang Gagasan',
    blogTitle: 'Kabar & Pemikiran Terbaru',
    blogButtonLabel: 'Baca Semua Tulisan',
    blogEmptyText: 'Belum ada artikel.',
    ctaEyebrow: 'Informasi Umum',
    ctaButtonLabel: 'Baca FAQ',
    ctaButtonHref: '/#faq',
  },
  landing_cta: {
    title: 'Jadilah Bagian dari Perubahan',
    description: 'Bersama IKMI, mari membangun jejaring, mengasah potensi, dan memberikan dampak bagi Indramayu.'
  },
  about_page: {
    historyTitle: 'Sejarah IKMI',
    history: 'Ikatan Keluarga Mahasiswa Indramayu (IKMI) Se-Wilayah Cirebon didirikan sebagai respons atas kebutuhan mahasiswa asal Indramayu yang menempuh pendidikan di Cirebon untuk memiliki wadah silaturahmi, diskusi, dan aksi.',
    vision: 'Mewujudkan organisasi mahasiswa daerah yang inklusif, progresif, dan berdaya saing sebagai katalisator perubahan sosial di Indramayu melalui kolaborasi di tanah Cirebon.',
    missions: [
      'Membangun solidaritas dan kepedulian antar mahasiswa Indramayu di Cirebon.',
      'Meningkatkan kapasitas akademik, intelektual, dan kepemimpinan anggota.',
      'Menjaga dan melestarikan nilai-nilai kearifan lokal Indramayu.',
      'Memberikan kontribusi nyata berupa pengabdian masyarakat.'
    ],
    values: [
      { title: 'Humanis', description: 'Menjunjung tinggi nilai kemanusiaan, empati, dan kepedulian terhadap sesama.' },
      { title: 'Akademis', description: 'Mengedepankan nalar kritis, riset, dan budaya literasi dalam setiap tindakan.' },
      { title: 'Progresif', description: 'Terus berinovasi dan tidak anti terhadap perubahan zaman demi kemajuan.' }
    ]
  },
  about_page_extended: {
    fallbackCabinet: {
      name: 'Sri Nangala Wira Perkasa',
      period: '2026–2027',
      tagline: 'Berani bermimpi, nyata mengabdi.',
      vision: 'Mewujudkan organisasi mahasiswa kedaerahan yang berperan sebagai ruang pengembangan intelektual, penguatan identitas daerah, serta penggerak kesadaran kritis dan kontribusi nyata bagi kemajuan daerah.',
      missions: [
        'Mengembangkan kapasitas intelektual mahasiswa melalui kegiatan diskusi, kajian ilmiah, pelatihan, dan riset yang berpijak pada persoalan daerah.',
        'Menumbuhkan kesadaran historis, sosial, dan kultural terhadap daerah sebagai bagian dari identitas dan tanggung jawab mahasiswa.',
        'Mendorong sikap kritis, progresif, dan solutif dalam merespons isu-isu daerah, nasional, maupun global.',
        'Menjadi wadah konsolidasi mahasiswa daerah untuk membangun jejaring intelektual, sosial, dan advokasi kebijakan yang berpihak pada kepentingan masyarakat daerah.',
        'Mengimplementasikan nilai keilmuan dan pengabdian melalui program pengabdian masyarakat berbasis kebutuhan dan potensi daerah.',
      ],
    },
    philosophyElements: [
      {
        word: 'Sri',
        meaning: 'Keberkahan & Kesejahteraan',
        desc: 'Mencerminkan harapan agar kabinet ini mampu membawa keberkahan, kejayaan, serta kesejahteraan bagi seluruh anggota dan masyarakat.',
      },
      {
        word: 'Nangala',
        meaning: 'Ketajaman Visi & Strategi Matang',
        desc: 'Nangala secara historis merujuk pada senjata tombak atau kekuatan utama dalam peperangan. Filosofinya adalah ketajaman visi, ketegasan sikap, serta kesiapan dalam menghadapi berbagai tantangan organisasi dengan strategi yang matang.',
      },
      {
        word: 'Wira',
        meaning: 'Pahlawan & Semangat Pengabdian',
        desc: 'Wira berarti pahlawan atau sosok pemberani. Ini menggambarkan karakter anggota kabinet yang memiliki keberanian, jiwa kepemimpinan, dan semangat pengabdian tanpa pamrih.',
      },
      {
        word: 'Perkasa',
        meaning: 'Kuat & Tidak Mudah Goyah',
        desc: 'Perkasa bermakna kuat, tangguh, dan tidak mudah goyah. Kata ini menegaskan bahwa kabinet diharapkan memiliki ketahanan, soliditas, serta kekuatan dalam menjalankan amanah dan menghadapi dinamika organisasi.',
      },
    ],
    coreValues: [
      {
        title: 'Kemahasiswaan',
        desc: 'Meningkatkan kualitas intelektual mahasiswa.',
        icon: 'BookOpen',
      },
      {
        title: 'Kekeluargaan',
        desc: 'Mempererat solidaritas dan kebersamaan.',
        icon: 'Users',
      },
      {
        title: 'Kedaerahan',
        desc: 'Menjaga identitas dan melestarikan nilai daerah.',
        icon: 'Compass',
      },
      {
        title: 'Sosial',
        desc: 'Berperan aktif dalam kegiatan sosial.',
        icon: 'Shield',
      },
      {
        title: 'Pengabdian',
        desc: 'Menghadirkan kontribusi nyata bagi masyarakat.',
        icon: 'HandHeart',
      },
    ],
    timelineItems: [
      {
        period: 'Dari dekade 2010-an',
        meta: 'Era rumpun paguyuban',
        title: 'Kelahiran Pergerakan & Silaturahmi Kamar Rantau',
        desc: 'Berawal dari forum silaturahmi informal mingguan yang dikoordinasikan antarkampus UGJ, IAIN, dan UMC untuk membantu mahasiswa baru beradaptasi di Cirebon. Forum ini menyatukan simpul kekeluargaan dan meringankan tantangan perantauan.',
      },
      {
        period: 'Desember 2018',
        meta: 'Transformasi kelembagaan',
        title: 'Transformasi Konstitusional & AD/ART Berdaulat',
        desc: 'Formalisasi Anggaran Dasar dan Anggaran Rumah Tangga (AD/ART) secara independen menjadi tonggak tata kelola kepengurusan se-Wilayah Cirebon yang lebih sistematis dan adaptif.',
      },
      {
        period: 'Kini & masa depan',
        meta: 'Periode aktif',
        title: 'Akselerasi Kabinet Periode Aktif',
        desc: 'Mengusung kepemimpinan yang berwibawa, inovatif, dan berfokus pada kontribusi nyata bagi daerah melalui penguatan organisasi, pengabdian, dan pengembangan gagasan.',
        active: true,
      },
    ],
  },
  contact_info: {
    email: 'ikmikominfo@gmail.com',
    whatsapp: '',
    address: 'Cirebon, Jawa Barat',
    instagram: 'https://instagram.com/ikmicirebon',
    tiktok: '',
    youtube: ''
  },
  seo_config: {
    metaTitle: 'IKMI Cirebon | Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon',
    metaDescription: 'Website resmi IKMI Cirebon, Ikatan Keluarga Mahasiswa Indramayu Se-Wilayah Cirebon. Wadah organisasi mahasiswa Indramayu di wilayah Cirebon.',
    ogImage: IKMI_LOGO_URL,
    keywords: 'ikmi cirebon, ikmi sewilayah cirebon, ikatan keluarga mahasiswa indramayu, ikatan keluarga mahasiswa indramayu sewilayah cirebon, organisasi ikmi sewilayah cirebon, mahasiswa Indramayu Cirebon, organisasi mahasiswa daerah Indramayu'
  }
}
