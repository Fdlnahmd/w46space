import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

const translations = {
  id: {
    // Navbar
    nav_home: 'Beranda',
    nav_rooms: 'Daftar Ruangan',
    nav_popular: 'Populer',
    nav_my_orders: 'Pesanan Saya',
    nav_profile: 'Profil',
    nav_admin: 'Admin',
    nav_logout: 'Keluar',
    nav_login: 'Masuk',
    nav_register: 'Daftar',

    // Hero
    hero_badge: 'Gedung Wisma 46, Kota BNI Jakarta',
    hero_title: 'Sewa Ruang Kerja Wisma 46',
    hero_subtitle: 'Office suite, meeting room, dan coworking space premium di gedung pencakar langit ikonik Jakarta — lokasi strategis, fasilitas kelas dunia.',
    hero_cta: 'Lihat Ruangan Tersedia',

    // Home sections
    home_latest_title: 'Ruangan Terbaru Wisma 46',
    home_latest_subtitle: 'Pilihan ruang terbaru yang tersedia untuk disewa di Wisma 46.',
    home_popular_btn: 'Ruangan Populer',
    home_see_all: 'Lihat Semua',
    home_reviews_title: 'Ulasan Penyewa Wisma 46',
    home_reviews_subtitle: 'Pengalaman nyata dari pelaku bisnis yang telah menyewa ruang di Wisma 46 — gedung bergengsi di jantung CBD Jakarta.',
    home_no_reviews: 'Belum ada ulasan yang ditampilkan.',
    home_tenant_of: 'Penyewa',

    // Room card
    capacity: 'Kapasitas',
    people: 'orang',
    start_from: 'Mulai dari',
    per_day: '/hari',
    detail: 'Detail',
    status_available: 'Tersedia',
    status_full: 'Penuh',
    status_maintenance: 'Pemeliharaan',

    // Daftar Ruangan
    rooms_title: 'Daftar Ruangan',
    rooms_subtitle: 'Temukan ruang kerja ideal di Wisma 46 yang sesuai kebutuhan bisnis Anda.',
    search_placeholder: 'Cari nama ruangan...',
    filter_all_categories: 'Semua Kategori',
    filter_all_status: 'Semua Status',
    sort_by: 'Urutkan:',
    sort_price_asc: 'Harga Terendah',
    sort_price_desc: 'Harga Tertinggi',
    sort_name_asc: 'Nama A-Z',
    sort_name_desc: 'Nama Z-A',
    no_rooms_found: 'Tidak ada ruangan yang sesuai kriteria pencarian Anda.',

    // Popular
    popular_title: 'Ruangan Paling Populer',
    popular_subtitle: 'Ruangan favorit penyewa di Wisma 46 berdasarkan jumlah ulasan terbaik.',

    // Footer
    footer_address: 'Kota BNI, Jl. Jend. Sudirman Kav. 1, Jakarta 10220',
    footer_desc: 'Platform resmi penyewaan Office, Meeting Room, dan Coworking Space premium di gedung ikonik Wisma 46 — jantung bisnis Jakarta.',
    footer_copyright: 'Wisma 46 Space. Hak Cipta Dilindungi.',

    // Login
    login_title: 'Selamat Datang',
    login_subtitle: 'Masuk ke akun Anda untuk melanjutkan',
    login_email: 'Email',
    login_password: 'Password',
    login_forgot: 'Lupa Password?',
    login_btn: 'Masuk',
    login_no_account: 'Belum punya akun?',
    login_register_link: 'Daftar sekarang',
    back_to_home: 'Kembali ke Beranda',

    // Register
    register_title: 'Buat Akun Baru',
    register_subtitle: 'Daftar untuk mulai menyewa ruangan',
    register_name: 'Nama Lengkap',
    register_btn: 'Daftar',
    register_has_account: 'Sudah punya akun?',
    register_login_link: 'Masuk di sini',

    // Detail Ruangan
    book_now: 'Pesan Sekarang',
    facilities: 'Fasilitas',
    reviews: 'Ulasan',
    addons: 'Tambahan (Add-on)',
    no_reviews_yet: 'Belum ada ulasan untuk ruangan ini.',
    please_login: 'Silakan login untuk memesan.',

    // Admin
    admin_dashboard: 'Dashboard',
    admin_rooms: 'Kelola Ruangan',
    admin_orders: 'Kelola Pemesanan',
    admin_reviews: 'Moderasi Ulasan',
    admin_coupons: 'Kelola Kupon',
    admin_back: 'Kembali ke Web',
  },

  en: {
    // Navbar
    nav_home: 'Home',
    nav_rooms: 'Browse Rooms',
    nav_popular: 'Popular',
    nav_my_orders: 'My Bookings',
    nav_profile: 'Profile',
    nav_admin: 'Admin',
    nav_logout: 'Sign Out',
    nav_login: 'Sign In',
    nav_register: 'Register',

    // Hero
    hero_badge: 'Wisma 46 Building, Kota BNI Jakarta',
    hero_title: 'Rent Workspace Wisma 46',
    hero_subtitle: 'Premium office suites, meeting rooms, and coworking spaces in Jakarta\'s iconic skyscraper — Business District Location, world-class facilities.',
    hero_cta: 'View Available Rooms',

    // Home sections
    home_latest_title: 'Newest Rooms Wisma 46',
    home_latest_subtitle: 'Newly available spaces ready for rent at Wisma 46.',
    home_popular_btn: 'Popular Rooms',
    home_see_all: 'See All',
    home_reviews_title: 'Tenant Reviews',
    home_reviews_subtitle: 'Real experiences from business professionals who have rented at Wisma 46 — Jakarta\'s most prestigious address.',
    home_no_reviews: 'No reviews to display yet.',
    home_tenant_of: 'Tenant at',

    // Room card
    capacity: 'Capacity',
    people: 'people',
    start_from: 'Starting from',
    per_day: '/day',
    detail: 'Detail',
    status_available: 'Available',
    status_full: 'Fully Booked',
    status_maintenance: 'Maintenance',

    // Daftar Ruangan
    rooms_title: 'Browse Rooms',
    rooms_subtitle: 'Find the perfect workspace at Wisma 46 tailored to your business needs.',
    search_placeholder: 'Search room name...',
    filter_all_categories: 'All Categories',
    filter_all_status: 'All Status',
    sort_by: 'Sort by:',
    sort_price_asc: 'Lowest Price',
    sort_price_desc: 'Highest Price',
    sort_name_asc: 'Name A-Z',
    sort_name_desc: 'Name Z-A',
    no_rooms_found: 'No rooms match your search criteria.',

    // Popular
    popular_title: 'Most Popular Rooms',
    popular_subtitle: 'Tenant favorites at Wisma 46 based on top ratings and reviews.',

    // Footer
    footer_address: 'Kota BNI, Jl. Jend. Sudirman Kav. 1, Jakarta 10220',
    footer_desc: 'The official rental platform for premium Office, Meeting Room, and Coworking Space at the iconic Wisma 46 — the heart of Jakarta\'s business district.',
    footer_copyright: 'Wisma 46 Space. All Rights Reserved.',

    // Login
    login_title: 'Welcome Back',
    login_subtitle: 'Sign in to your account to continue',
    login_email: 'Email',
    login_password: 'Password',
    login_forgot: 'Forgot Password?',
    login_btn: 'Sign In',
    login_no_account: 'Don\'t have an account?',
    login_register_link: 'Register now',
    back_to_home: 'Back to Home',

    // Register
    register_title: 'Create an Account',
    register_subtitle: 'Register to start booking rooms',
    register_name: 'Full Name',
    register_btn: 'Register',
    register_has_account: 'Already have an account?',
    register_login_link: 'Sign in here',

    // Detail Ruangan
    book_now: 'Book Now',
    facilities: 'Facilities',
    reviews: 'Reviews',
    addons: 'Add-ons',
    no_reviews_yet: 'No reviews for this room yet.',
    please_login: 'Please sign in to make a booking.',

    // Admin
    admin_dashboard: 'Dashboard',
    admin_rooms: 'Manage Rooms',
    admin_orders: 'Manage Bookings',
    admin_reviews: 'Moderate Reviews',
    admin_coupons: 'Manage Coupons',
    admin_back: 'Back to Website',
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'id');

  const toggleLang = () => {
    const next = lang === 'id' ? 'en' : 'id';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  const t = (key) => translations[lang]?.[key] ?? translations['id'][key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);
