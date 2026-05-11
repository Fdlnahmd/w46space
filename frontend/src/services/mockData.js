// ─── UTILITIES UNTUK PERSISTENCE ───────────────────────────────────────────
// Menggunakan localStorage agar data tidak hilang saat direfresh/logout
const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const getFromStorage = (key) => JSON.parse(localStorage.getItem(key));

// ─── INITIAL DATA ──────────────────────────────────────────────────────────

const initialRuangan = [
  {
    id: 1,
    nama: "Ruang Rapat Eksekutif",
    kapasitas: 10,
    harga: 500000,
    fasilitas: ["Proyektor", "Papan Tulis", "AC", "WiFi"],
    deskripsi: "Ruangan rapat nyaman dan eksklusif untuk pertemuan penting Anda.",
    gambar: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    status: "Tersedia"
  },
  {
    id: 2,
    nama: "Ruang Kolaborasi",
    kapasitas: 25,
    harga: 1200000,
    fasilitas: ["TV Pintar", "Sistem Audio", "AC", "WiFi", "Kopi & Teh"],
    deskripsi: "Ruang luas yang cocok untuk workshop, seminar, atau kolaborasi tim.",
    gambar: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800",
    status: "Tersedia"
  },
  {
    id: 3,
    nama: "Private Office A",
    kapasitas: 4,
    harga: 300000,
    fasilitas: ["Meja Kerja", "AC", "WiFi", "Loker"],
    deskripsi: "Ruang kantor privat untuk startup atau tim kecil.",
    gambar: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=800",
    status: "Penuh"
  }
];

const initialUsers = [
  { id: 1, nama: "Admin Web", email: "admin@sewaruang.com", password: "password", role: "admin" },
  { id: 2, nama: "Budi Santoso", email: "budi@gmail.com", password: "password", role: "user" }
];

const initialPemesanan = [
  {
    id: 1,
    idUser: 2,
    idRuangan: 1,
    namaPemesan: "Budi Santoso",
    perusahaan: "PT Teknologi Maju",
    tanggalMulai: "2026-05-11",
    tanggalAkhir: "2026-07-11",
    durasi: 2,
    waktuMulai: "08:00",
    waktuSelesai: "17:00",
    status: "Dikonfirmasi",
    totalHarga: 3000000
  }
];

// Ambil data dari storage atau gunakan data awal
let ruangan = getFromStorage('sr_ruangan') || initialRuangan;
let users = getFromStorage('sr_users') || initialUsers;
let pemesanan = getFromStorage('sr_pemesanan') || initialPemesanan;

// Simpan data awal jika storage masih kosong
if (!getFromStorage('sr_ruangan')) saveToStorage('sr_ruangan', ruangan);
if (!getFromStorage('sr_users')) saveToStorage('sr_users', users);
if (!getFromStorage('sr_pemesanan')) saveToStorage('sr_pemesanan', pemesanan);


// ─── SERVICES RUANGAN ──────────────────────────────────────────────────────

export const getRuangan = () => Promise.resolve([...ruangan]);

export const getRuanganById = (id) => {
  const ruang = ruangan.find(r => r.id === parseInt(id));
  return Promise.resolve(ruang);
};

export const createRuangan = (data) => {
  const newRuang = { ...data, id: Date.now() };
  ruangan.push(newRuang);
  saveToStorage('sr_ruangan', ruangan);
  return Promise.resolve(newRuang);
};

export const updateRuangan = (id, data) => {
  const index = ruangan.findIndex(r => r.id === parseInt(id));
  if (index !== -1) {
    ruangan[index] = { ...ruangan[index], ...data };
    saveToStorage('sr_ruangan', ruangan);
    return Promise.resolve(ruangan[index]);
  }
  return Promise.reject(new Error("Ruangan tidak ditemukan"));
};

export const deleteRuangan = (id) => {
  ruangan = ruangan.filter(r => r.id !== parseInt(id));
  saveToStorage('sr_ruangan', ruangan);
  return Promise.resolve(true);
};


// ─── SERVICES PEMESANAN ────────────────────────────────────────────────────

export const getPemesanan = () => {
  const populated = pemesanan.map(p => ({
    ...p,
    ruangan: ruangan.find(r => r.id === p.idRuangan)
  }));
  return Promise.resolve(populated);
};

export const getPemesananById = (id) => {
  const p = pemesanan.find(p => p.id === parseInt(id));
  if (!p) return Promise.resolve(null);
  return Promise.resolve({
    ...p,
    ruangan: ruangan.find(r => r.id === p.idRuangan)
  });
};

export const createPemesanan = (data) => {
  const newPemesanan = { ...data, id: Date.now(), status: "Pending" };
  pemesanan.push(newPemesanan);
  saveToStorage('sr_pemesanan', pemesanan);
  return Promise.resolve(newPemesanan);
};

export const updatePemesanan = (id, data) => {
  const index = pemesanan.findIndex(p => p.id === parseInt(id));
  if (index !== -1) {
    pemesanan[index] = { ...pemesanan[index], ...data };
    saveToStorage('sr_pemesanan', pemesanan);
    return Promise.resolve(pemesanan[index]);
  }
  return Promise.reject(new Error('Pemesanan tidak ditemukan'));
};

export const updateStatusPemesanan = (id, status) => {
  const index = pemesanan.findIndex(p => p.id === parseInt(id));
  if (index !== -1) {
    pemesanan[index].status = status;
    saveToStorage('sr_pemesanan', pemesanan);
    return Promise.resolve(pemesanan[index]);
  }
  return Promise.reject(new Error("Pemesanan tidak ditemukan"));
};

export const deletePemesanan = (id) => {
  pemesanan = pemesanan.filter(p => p.id !== parseInt(id));
  saveToStorage('sr_pemesanan', pemesanan);
  return Promise.resolve(true);
};

export const getPemesananByUser = (idUser) => {
  const populated = pemesanan
    .filter(p => p.idUser === idUser)
    .map(p => ({
      ...p,
      ruangan: ruangan.find(r => r.id === p.idRuangan)
    }));
  return Promise.resolve(populated);
};

export const batalkanPemesanan = (id) => {
  const index = pemesanan.findIndex(p => p.id === parseInt(id));
  if (index !== -1 && pemesanan[index].status === 'Pending') {
    pemesanan[index].status = 'Dibatalkan';
    saveToStorage('sr_pemesanan', pemesanan);
    return Promise.resolve(pemesanan[index]);
  }
  return Promise.reject(new Error('Hanya pemesanan berstatus Pending yang dapat dibatalkan'));
};


// ─── SERVICES AUTH ─────────────────────────────────────────────────────────

export const mockLogin = (email, password) => {
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    return Promise.resolve(userWithoutPassword);
  }
  return Promise.reject(new Error("Email atau password salah"));
};

export const mockRegister = (data) => {
  const exists = users.find(u => u.email === data.email);
  if (exists) {
    return Promise.reject(new Error("Email sudah terdaftar"));
  }
  const newUser = { ...data, id: Date.now(), role: 'user' };
  users.push(newUser);
  saveToStorage('sr_users', users); // SIMPAN KE STORAGE
  const { password, ...userWithoutPassword } = newUser;
  return Promise.resolve(userWithoutPassword);
};
