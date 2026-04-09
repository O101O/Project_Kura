import { Apple, Camera, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const isLogin = mode === 'login';

  return (
    <div className="w-full max-w-md animate-fadeIn rounded-[2rem] border border-white/70 bg-white/58 p-6 shadow-[0_30px_90px_-38px_rgba(54,37,101,0.38)] backdrop-blur-2xl sm:p-7">
      <div className="mb-7">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {isLogin ? 'Log in to Kura' : 'Create your Kura profile'}
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
            {isLogin
              ? 'Continue your conversations with a cleaner, safer messaging experience.'
              : 'Set up your identity, add a profile photo, and join Kura with a more welcoming first step.'}
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-100 bg-white/85 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:border-brand-200 hover:bg-brand-50/50"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path
              fill="currentColor"
              d="M21.8 12.23c0-.73-.06-1.43-.2-2.09H12v3.95h5.5a4.73 4.73 0 0 1-2.04 3.1v2.57h3.3c1.94-1.79 3.04-4.43 3.04-7.53Z"
            />
            <path
              fill="currentColor"
              d="M12 22c2.76 0 5.08-.91 6.77-2.47l-3.3-2.57c-.92.62-2.09.99-3.47.99-2.66 0-4.92-1.8-5.73-4.22H2.86v2.65A10.22 10.22 0 0 0 12 22Z"
            />
            <path
              fill="currentColor"
              d="M6.27 13.73A6.14 6.14 0 0 1 5.95 12c0-.6.11-1.18.32-1.73V7.62H2.86A10.01 10.01 0 0 0 1.8 12c0 1.61.39 3.13 1.06 4.38l3.41-2.65Z"
            />
            <path
              fill="currentColor"
              d="M12 6.05c1.5 0 2.84.52 3.9 1.54l2.92-2.92C17.07 3.04 14.76 2 12 2A10.22 10.22 0 0 0 2.86 7.62l3.41 2.65c.81-2.42 3.07-4.22 5.73-4.22Z"
            />
          </svg>
          Continue with Google
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-100 bg-white/85 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:border-brand-200 hover:bg-brand-50/50"
        >
          <Apple size={16} />
          Continue with Apple
        </button>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">or continue with email</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form className="space-y-3.5" onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            className="kura-input bg-white/95"
            placeholder="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        )}

        <input
          type="email"
          className="kura-input bg-white/95"
          placeholder="Email address"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="kura-input bg-white/95 pr-11"
            placeholder="Password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {isLogin && (
          <div className="flex items-center justify-between gap-4 px-1">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
              Keep me signed in
            </label>
            <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-500">
              <ShieldCheck size={14} />
              Forgotten your password?
            </Link>
          </div>
        )}

        {!isLogin && (
          <>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="kura-input bg-white/95 pr-11"
                placeholder="Confirm Password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-brand-200 bg-white/70 px-4 py-3 text-sm text-slate-600 hover:border-brand-400 hover:bg-brand-50/60">
              <span className="inline-flex items-center gap-2">
                <Camera size={15} />
                {form.profilePic ? form.profilePic.name : 'Upload profile picture'}
              </span>
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-medium shadow-sm">Choose</span>
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

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-w-[120px] items-center justify-center rounded-full border border-white/35 bg-[linear-gradient(135deg,#8d31ff_0%,#456cff_58%,#1dd9d2_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_22px_40px_-18px_rgba(69,108,255,0.55)] hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Please wait...' : isLogin ? 'Log in' : 'Create my account'}
          </button>
        </div>
      </form>

      <div className="mt-6 rounded-2xl bg-[linear-gradient(135deg,rgba(245,239,255,0.8),rgba(232,249,255,0.7))] px-4 py-3 text-center">
        <p className="text-sm font-medium text-slate-700">
          {isLogin ? 'New to Kura?' : 'Already have an account?'}
          {' '}
          <button type="button" className="font-semibold text-brand-700 hover:text-brand-500" onClick={onToggle}>
            {isLogin ? 'Join now' : 'Back to login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthCard;
