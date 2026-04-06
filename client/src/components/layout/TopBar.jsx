import { LogOut, Moon, Sparkles, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const TopBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  return (
    <header className="kura-card flex items-center justify-between px-5 py-4 md:px-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Workspace</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Kura Messenger</h1>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="hidden items-center gap-1.5 rounded-xl bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-200 md:inline-flex">
          <Sparkles size={13} /> Live
        </span>
        <button onClick={toggleTheme} className="kura-icon-btn" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
