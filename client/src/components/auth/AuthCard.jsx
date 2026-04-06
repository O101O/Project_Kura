import { Camera, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const AuthCard = ({ mode, onSubmit, onToggle, loading, error }) => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profilePic: null
  });

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="kura-card w-full max-w-md p-8 animate-fadeIn lg:p-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login' ? 'Sign in to continue your conversations.' : 'Start chatting with your circle on Kura.'}
          </p>
        </div>
        <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-900/30 dark:text-brand-200">
          <Sparkles size={18} />
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <input
            className="kura-input"
            placeholder="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        )}

        <input
          type="email"
          className="kura-input"
          placeholder="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          className="kura-input"
          placeholder="Password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          minLength={6}
        />

        {mode === 'register' && (
          <>
            <input
              type="password"
              className="kura-input"
              placeholder="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
            />

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 hover:border-brand-300 hover:bg-brand-50/40 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:bg-brand-900/20">
              <span className="inline-flex items-center gap-2">
                <Camera size={15} />
                {form.profilePic ? form.profilePic.name : 'Upload profile picture'}
              </span>
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-medium dark:bg-slate-900">Choose</span>
              <input
                type="file"
                name="profilePic"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              />
            </label>
          </>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-300/60 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-indigo-900/30"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        {mode === 'login' ? (
          <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-500">
            <ShieldCheck size={14} />
            Forgot password?
          </Link>
        ) : <span />}
        <button type="button" className="text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100" onClick={onToggle}>
          {mode === 'login' ? 'Create an account' : 'Back to login'}
        </button>
      </div>
    </div>
  );
};

export default AuthCard;
