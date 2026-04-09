import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import AuthCard from '../components/auth/AuthCard';
import AuthShell from '../components/auth/AuthShell';
import { useAuth } from '../context/AuthContext';
import { APP_ROUTES } from '../utils/constants';

const AuthPage = () => {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={APP_ROUTES.root} replace />;
  }

  const handleSubmit = async (form) => {
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!form.email || !form.password) {
          throw new Error('Email and password are required');
        }
        await login(form.email, form.password);
      } else {
        if (form.password !== form.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const data = new FormData();
        data.append('username', form.username);
        data.append('email', form.email);
        data.append('password', form.password);
        data.append('confirmPassword', form.confirmPassword);
        if (form.profilePic) {
          data.append('profilePic', form.profilePic);
        }

        await register(data);
      }
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mode={mode}>
      <AuthCard
        mode={mode}
        onSubmit={handleSubmit}
        onToggle={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
        loading={loading}
        error={error}
      />
    </AuthShell>
  );
};

export default AuthPage;
