/**
 * Settings page component that renders the settings panel.
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import SettingsPanel from '../components/settings/SettingsPanel';
import { APP_ROUTES } from '../utils/constants';

const SettingsPage = () => {
  const { user, setUser, logout } = useAuth();
  const { socket } = useSocket(user?._id);
  const location = useLocation();
  const navigate = useNavigate();

  const returnTo = location.state?.from || APP_ROUTES.dashboard;

  return (
    <SettingsPanel
      open
      onClose={() => navigate(returnTo)}
      user={user}
      setUser={setUser}
      socket={socket}
      onLogout={logout}
    />
  );
};

export default SettingsPage;