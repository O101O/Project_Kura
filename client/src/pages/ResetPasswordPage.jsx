import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell';
import api from '../utils/api';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post(`/auth/reset-password/${token}`, {
        password: form.password
      });
      setSuccess('Your password has been reset successfully');
      setTimeout(() => navigate('/auth'), 1500);
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="kura-card w-full max-w-md p-8 animate-fadeIn lg:p-10">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Reset password
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Choose a new password for your Kura account.
            </p>
          </div>
          <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-900/30 dark:text-brand-200">
            <KeyRound size={18} />
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="password"
            className="kura-input"
            placeholder="New password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />

          <input
            type="password"
            className="kura-input"
            placeholder="Confirm new password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
          />

          {success && (
            <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 shrink-0" size={16} />
              <span>{success}</span>
            </p>
          )}

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-300/60 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-indigo-900/30"
          >
            {loading ? 'Updating password...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-4 text-right text-sm">
          <Link to="/auth" className="text-brand-600 hover:text-brand-500">
            Back to login
          </Link>
        </div>
      </div>
    </AuthShell>
  );
};

export default ResetPasswordPage;
