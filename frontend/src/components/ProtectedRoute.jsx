import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — Route-level authorization guard (Audit 7.1)
 * 
 * Ensures that:
 * 1. Only authenticated users can access protected pages
 * 2. Only users with allowed roles can reach role-specific dashboards
 * 3. Unauthenticated users are redirected to /auth
 * 4. Wrong-role users are redirected to their correct dashboard
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Show nothing while auth state is being verified (prevents flash of redirect)
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#003893]/20 border-t-[#003893] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#003893] font-serif text-xs tracking-widest uppercase animate-pulse">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but wrong role → redirect to their correct dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashboardMap = {
      admin: '/admin/dashboard',
      client: '/client/dashboard',
      driver: '/driver/dashboard',
    };
    const correctDashboard = dashboardMap[user.role] || '/';
    return <Navigate to={correctDashboard} replace />;
  }

  return children;
};

export default ProtectedRoute;
