import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute
 * - Jika requiredRole = 'admin' → hanya admin yang bisa masuk
 * - Jika requiredRole = 'user'  → hanya user biasa yang bisa masuk (admin tidak bisa)
 * - Jika tidak ada requiredRole  → cukup sudah login (semua role boleh masuk)
 */
const ProtectedRoute = ({ requiredRole }) => {
  const { user } = useAuth();

  // Belum login → arahkan ke halaman login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Ada role yang disyaratkan tapi tidak cocok
  if (requiredRole && user.role !== requiredRole) {
    // Kalau admin mencoba masuk ke /pesanan-saya → kembali ke beranda
    // Kalau user biasa mencoba masuk ke /admin → kembali ke beranda
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
