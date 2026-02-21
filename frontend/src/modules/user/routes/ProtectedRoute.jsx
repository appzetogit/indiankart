import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Loader from '../../../components/common/Loader';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuthStore();
    const location = useLocation();

    if (loading) return <Loader fullPage message="Checking account..." variant="shimmer" />;

    if (!isAuthenticated) {
        // Redirect to login but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
