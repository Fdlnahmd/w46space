import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import FloatingChat from './components/FloatingChat';

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
import KelolaKupon from './pages/admin/KelolaKupon';
import AdminChat from './pages/admin/AdminChat';

// Wrapper untuk halaman publik (dengan Navbar & Footer)
const PublicLayout = ({ children }) => {
  const { user } = useAuth();
  const isStaff = user && ['admin', 'helpdesk'].includes(user.role?.toLowerCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
      {!isStaff && <FloatingWhatsApp />}
      <FloatingChat />
    </div>
  );
};

// Pengarah halaman indeks admin berdasarkan role
const AdminIndex = () => {
  const { user } = useAuth();
  if (user?.role?.toLowerCase() === 'helpdesk') {
    return <Navigate to="/admin/chat" replace />;
  }
  return <AdminDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
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

          {/* Admin Routes — bisa diakses admin dan helpdesk */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'helpdesk']} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminIndex />} />
              <Route path="dashboard" element={<AdminIndex />} />

              {/* CRUD Pemesanan (Akses Bersama) */}
              <Route path="pemesanan" element={<KelolaPemesanan />} />
              <Route path="pemesanan/:id" element={<DetailPemesananAdmin />} />
              <Route path="pemesanan/edit/:id" element={<FormPemesanan />} />

              {/* Live Chat (Akses Bersama) */}
              <Route path="chat" element={<AdminChat />} />

              {/* Fitur Khusus Admin Utama */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                {/* CRUD Ruangan */}
                <Route path="ruangan" element={<KelolaRuangan />} />
                <Route path="ruangan/tambah" element={<FormRuangan />} />
                <Route path="ruangan/edit/:id" element={<FormRuangan />} />

                {/* Moderasi Ulasan */}
                <Route path="ulasan" element={<AdminReviews />} />

                {/* Kelola Kupon */}
                <Route path="kupon" element={<KelolaKupon />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all route for 404 */}
          <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
        </Routes>
        </Router>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;