import { Camera, ShieldCheck } from 'lucide-react';
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
    <div className="w-full max-w-md animate-fadeIn">
      <div className="mb-7">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {mode === 'login' ? 'Log in to Kura' : 'Create your account'}
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
            {mode === 'login'
              ? 'Continue your conversations with a cleaner, safer messaging experience.'
              : 'Start chatting with your circle on Kura with secure sign up and recovery options.'}
          </p>
        </div>
      </div>

      <form className="space-y-3.5" onSubmit={handleSubmit}>
        {mode === 'register' && (
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
          placeholder="Email or phone number"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          className="kura-input bg-white/95"
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
              className="kura-input bg-white/95"
              placeholder="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
            />

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

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-w-[120px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#8d31ff_0%,#456cff_58%,#1dd9d2_100%)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-200/50 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create Account'}
          </button>

          {mode === 'login' && (
            <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-500">
              <ShieldCheck size={14} />
              Forgotten your password?
            </Link>
          )}
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <label className="inline-flex items-center gap-2 text-slate-500">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
          Keep me signed in
        </label>
        <button type="button" className="text-slate-500 hover:text-slate-800" onClick={onToggle}>
          {mode === 'login' ? 'Create an account' : 'Back to login'}
        </button>
      </div>
    </div>
  );
};

export default AuthCard;
