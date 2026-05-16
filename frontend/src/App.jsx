import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';

// Public Pages
import Home from './pages/Home';
import DaftarRuangan from './pages/DaftarRuangan';
import DetailRuangan from './pages/DetailRuangan';
import Login from './pages/Login';
import Register from './pages/Register';
import PopularRuangan from './pages/PopularRuangan';
import PesananSaya from './pages/PesananSaya';
import DetailPesanan from './pages/DetailPesanan';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import KelolaRuangan from './pages/admin/KelolaRuangan';
import FormRuangan from './pages/admin/FormRuangan';
import KelolaPemesanan from './pages/admin/KelolaPemesanan';
import FormPemesanan from './pages/admin/FormPemesanan';
import DetailPemesananAdmin from './pages/admin/DetailPemesananAdmin';
import AdminReviews from './pages/admin/Reviews';

// Wrapper untuk halaman publik (dengan Navbar & Footer)
const PublicLayout = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Navbar />
    <main style={{ flex: 1 }}>
      {children}
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
        <Routes>
          {/* Auth Routes (tanpa Navbar/Footer) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/ruangan" element={<PublicLayout><DaftarRuangan /></PublicLayout>} />
          <Route path="/populer" element={<PublicLayout><PopularRuangan /></PublicLayout>} />
          <Route path="/ruangan/:id" element={<PublicLayout><DetailRuangan /></PublicLayout>} />

          {/* Rute terproteksi untuk user yang sudah login (role: user) */}
          <Route path="/pesanan-saya" element={<ProtectedRoute requiredRole="user" />}>
            <Route index element={<PublicLayout><PesananSaya /></PublicLayout>} />
            <Route path=":id" element={<PublicLayout><DetailPesanan /></PublicLayout>} />
          </Route>
          {/* Rute Profil - Bisa diakses semua role yang login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<PublicLayout><Profile /></PublicLayout>} />
          </Route>

          {/* Admin Routes — hanya bisa diakses admin */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin" />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />

              {/* CRUD Ruangan */}
              <Route path="ruangan" element={<KelolaRuangan />} />
              <Route path="ruangan/tambah" element={<FormRuangan />} />
              <Route path="ruangan/edit/:id" element={<FormRuangan />} />

              {/* CRUD Pemesanan */}
              <Route path="pemesanan" element={<KelolaPemesanan />} />
              <Route path="pemesanan/:id" element={<DetailPemesananAdmin />} />
              <Route path="pemesanan/edit/:id" element={<FormPemesanan />} />

              {/* Moderasi Ulasan */}
              <Route path="ulasan" element={<AdminReviews />} />
            </Route>
          </Route>

          {/* Catch-all route for 404 */}
          <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
        </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;