import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import ContactsPage from './pages/ContactsPage';
import Dashboard from './pages/Dashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SettingsPage from './pages/SettingsPage';
import { APP_ROUTES } from './utils/constants';

/**
 * Main App component that defines the application routes.
 * Uses React Router for client-side routing.
 */
const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path={APP_ROUTES.auth} element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        path={APP_ROUTES.dashboard}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.chat}
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.contacts}
        element={
          <ProtectedRoute>
            <ContactsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.settings}
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Default redirects */}
      <Route path={APP_ROUTES.root} element={<Navigate to={APP_ROUTES.dashboard} replace />} />
      <Route path="*" element={<Navigate to={APP_ROUTES.dashboard} replace />} />
    </Routes>
  );
};

export default App;
