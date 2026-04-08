import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { APP_ROUTES } from '../../utils/constants';
import Loader from './Loader';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader text="Checking session..." />;
  }

  if (!user) {
    return <Navigate to={APP_ROUTES.auth} replace />;
  }

  return children;
};

export default ProtectedRoute;
