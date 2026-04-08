import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import ContactsPage from './pages/ContactsPage';
import Dashboard from './pages/Dashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { APP_ROUTES } from './utils/constants';

const App = () => {
  return (
    <Routes>
      <Route path={APP_ROUTES.auth} element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
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
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route path={APP_ROUTES.root} element={<Navigate to={APP_ROUTES.dashboard} replace />} />
      <Route path="*" element={<Navigate to={APP_ROUTES.dashboard} replace />} />
    </Routes>
  );
};

export default App;
