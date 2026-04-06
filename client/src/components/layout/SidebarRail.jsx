import { Home, MessageSquare, Phone, Settings, Star, Users2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const utilityIcons = [
  { id: 'calls', icon: Phone, label: 'Calls' },
  { id: 'teams', icon: Users2, label: 'Teams' },
  { id: 'starred', icon: Star, label: 'Starred' }
];

const SidebarRail = ({ settingsState }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home', path: '/dashboard' },
    { id: 'chat', icon: MessageSquare, label: 'Chat', path: '/chat' }
  ];

  const currentPath = location.pathname;

  return (
    <nav className="hidden w-11 shrink-0 flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 py-3 dark:border-slate-700 dark:bg-slate-800/70 lg:flex">
      {navItems.map(({ id, icon: Icon, label, path }) => {
        const isActive = currentPath === path;

        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => navigate(path)}
            className={`kura-icon-btn p-2 ${
              isActive
                ? 'border-brand-200 bg-brand-50 text-brand-700 shadow-md shadow-indigo-200/40 dark:border-brand-900/60 dark:bg-brand-900/30 dark:text-brand-200 dark:shadow-indigo-950/20'
                : ''
            }`}
          >
            <Icon size={14} />
          </button>
        );
      })}

      {utilityIcons.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          title={`${label} coming soon`}
          className="kura-icon-btn cursor-default p-2 opacity-75 hover:translate-y-0 hover:border-slate-200/80 hover:bg-white dark:hover:border-slate-700 dark:hover:bg-slate-900"
        >
          <Icon size={14} />
        </button>
      ))}

      <div className="mt-auto">
        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          onClick={() => navigate('/settings', { state: settingsState })}
          className={`kura-icon-btn p-2 ${
            currentPath === '/settings'
              ? 'border-brand-200 bg-brand-50 text-brand-700 shadow-md shadow-indigo-200/40 dark:border-brand-900/60 dark:bg-brand-900/30 dark:text-brand-200 dark:shadow-indigo-950/20'
              : ''
          }`}
        >
          <Settings size={14} />
        </button>
      </div>
    </nav>
  );
};

export default SidebarRail;
