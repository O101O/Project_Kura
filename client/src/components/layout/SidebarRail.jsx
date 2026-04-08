import { Home, MessageSquare, Phone, Settings, Star, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../utils/constants';

const utilityIcons = [
  { id: 'calls', icon: Phone, label: 'Calls' },
  { id: 'starred', icon: Star, label: 'Starred' }
];

const SidebarRail = ({ settingsState }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home', path: APP_ROUTES.dashboard },
    { id: 'chat', icon: MessageSquare, label: 'Chat', path: APP_ROUTES.chat },
    { id: 'contacts', icon: Users, label: 'Contacts', path: APP_ROUTES.contacts }
  ];

  const currentPath = location.pathname;

  return (
    <nav className="hidden w-12 shrink-0 flex-col items-center gap-3 rounded-2xl border border-brand-100/70 bg-white/60 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-800/70 lg:flex">
      {navItems.map(({ id, icon: Icon, label, path }) => {
        const isActive = currentPath === path;

        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => navigate(path)}
            className={`kura-icon-btn relative p-2 ${
              isActive
                ? 'border-brand-200 bg-[linear-gradient(135deg,rgba(245,239,255,0.95),rgba(232,249,255,0.95))] text-brand-700 shadow-md shadow-cyan-200/30 dark:border-brand-900/60 dark:bg-brand-900/30 dark:text-brand-200 dark:shadow-indigo-950/20'
                : ''
            }`}
          >
            {isActive && <span className="absolute -left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#8d31ff,#1dd9d2)]" />}
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
          className="kura-icon-btn cursor-default p-2 opacity-80 hover:translate-y-0"
        >
          <Icon size={14} />
        </button>
      ))}

      <div className="mt-auto">
        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          onClick={() => navigate(APP_ROUTES.settings, { state: settingsState })}
          className={`kura-icon-btn relative p-2 ${
            currentPath === APP_ROUTES.settings
              ? 'border-brand-200 bg-[linear-gradient(135deg,rgba(245,239,255,0.95),rgba(232,249,255,0.95))] text-brand-700 shadow-md shadow-cyan-200/30 dark:border-brand-900/60 dark:bg-brand-900/30 dark:text-brand-200 dark:shadow-indigo-950/20'
              : ''
          }`}
        >
          {currentPath === APP_ROUTES.settings && <span className="absolute -left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#8d31ff,#1dd9d2)]" />}
          <Settings size={14} />
        </button>
      </div>
    </nav>
  );
};

export default SidebarRail;
