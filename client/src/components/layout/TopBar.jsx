import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Moon, Sparkles, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { APP_ROUTES } from '../../utils/constants';

const TopBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const avatarSrc = user?.profilePic || `https://api.dicebear.com/8.x/initials/svg?seed=${user?.username || 'User'}`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const openSettings = () => {
    setMenuOpen(false);
    navigate(APP_ROUTES.settings, { state: { from: location.pathname } });
  };

  const openProfile = () => {
    setMenuOpen(false);
    navigate(APP_ROUTES.settings, { state: { from: location.pathname, tab: 'profile' } });
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate(APP_ROUTES.auth);
  };

  return (
    <header className="kura-card relative z-[80] overflow-visible flex items-center justify-between px-5 py-4 md:px-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Workspace</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Kura</h1>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="hidden items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,rgba(245,239,255,0.95),rgba(232,249,255,0.95))] px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-200 md:inline-flex">
          <Sparkles size={13} /> Live
        </span>
        <button onClick={toggleTheme} className="kura-icon-btn" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div ref={menuRef} className="relative z-[90]">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-2xl border border-brand-100 bg-white/80 px-2.5 py-1.5 text-left text-sm font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <img
              src={avatarSrc}
              alt={user?.username || 'User'}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-100 dark:ring-slate-700"
            />
            <span className="hidden max-w-[110px] truncate sm:inline">{user?.username || 'Profile'}</span>
            <ChevronDown size={15} className={`hidden text-slate-400 transition-transform sm:inline ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+0.65rem)] z-[100] w-56 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-200/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/30 animate-fadeIn">
              <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50/90 px-3 py-2.5 dark:bg-slate-800/70">
                <img
                  src={avatarSrc}
                  alt={user?.username || 'User'}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.username || 'Profile'}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email || 'Kura account'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={openProfile}
                className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Profile
              </button>
              <button
                type="button"
                onClick={openSettings}
                className="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
