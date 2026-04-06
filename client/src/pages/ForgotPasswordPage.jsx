import { AlertCircle, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell';
import api from '../utils/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setResetLink('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(data.message || 'Reset link generated');
      setResetLink(data.resetUrl || '');
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Unable to send reset link right now');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!resetLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(resetLink);
      setToast('Reset link copied to clipboard');
      window.setTimeout(() => setToast(''), 2200);
    } catch (_error) {
      setToast('Unable to copy link');
      window.setTimeout(() => setToast(''), 2200);
    }
  };

  return (
    <AuthShell>
      <div className="kura-card w-full max-w-md p-8 animate-fadeIn lg:p-10">
        {toast && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm animate-fadeIn dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            {toast}
          </div>
        )}

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Forgot your password?
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Enter your email address and we&apos;ll send you a secure reset link.
            </p>
          </div>
          <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-900/30 dark:text-brand-200">
            <Mail size={18} />
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            className="kura-input"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
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
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-300/60 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-indigo-900/30"
          >
            {loading ? 'Generating link...' : 'Generate Reset Link'}
          </button>
        </form>

        {resetLink && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 animate-fadeIn dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            <p className="font-medium">Demo Mode: Click below to reset your password</p>
            <p className="mt-1 text-emerald-600/90 dark:text-emerald-300/90">Link expires in 15 minutes</p>
            <div className="mt-3 rounded-lg bg-white/80 p-3 dark:bg-slate-900/60">
              <a href={resetLink} className="break-all text-blue-600 underline dark:text-blue-300">
                {resetLink}
              </a>
            </div>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-emerald-300 bg-white px-3 py-2 font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
              >
                Copy Link
              </button>
              <a
                href={resetLink}
                className="rounded-lg bg-gradient-to-r from-brand-600 to-blue-500 px-3 py-2 font-medium text-white"
              >
                Open Reset Page
              </a>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
            <ShieldCheck size={14} />
            Links expire in 15 minutes
          </p>
          <Link to="/auth" className="text-brand-600 hover:text-brand-500">
            Back to login
          </Link>
        </div>
      </div>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
