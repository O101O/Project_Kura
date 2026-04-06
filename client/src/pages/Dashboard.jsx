import { Activity, CalendarDays, MessageCircleMore, Sparkles, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import SidebarRail from '../components/layout/SidebarRail';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const dummyStarred = [
  { _id: 'demo-1', username: 'Maya Chen', bio: 'Design lead', status: 'online' },
  { _id: 'demo-2', username: 'Adrian Cole', bio: 'Product sync partner', status: 'online' },
  { _id: 'demo-3', username: 'Lina Park', bio: 'Ops channel favorite', status: 'offline' }
];

const dummyRecent = [
  { _id: 'recent-1', title: 'Maya Chen', preview: 'Let us lock the launch notes before noon.', timeLabel: 'Today, 08:42 AM' },
  { _id: 'recent-2', title: 'Sprint Crew', preview: 'Shared an image in the release room.', timeLabel: 'Today, 07:58 AM' },
  { _id: 'recent-3', title: 'Adrian Cole', preview: 'Can we review the dashboard draft today?', timeLabel: 'Yesterday, 06:15 PM' },
  { _id: 'recent-4', title: 'Lina Park', preview: 'Status update looks good from ops.', timeLabel: 'Yesterday, 03:40 PM' },
  { _id: 'recent-5', title: 'Design Review', preview: 'Next round of comments is ready.', timeLabel: 'Yesterday, 11:05 AM' }
];

const dummyUpcoming = [
  { id: 'meet-1', title: 'Standup with product', time: '09:30 AM', room: 'Horizon room' },
  { id: 'meet-2', title: 'Design review', time: '01:00 PM', room: 'Sprint board' },
  { id: 'meet-3', title: 'Release check-in', time: '04:15 PM', room: 'Launch hub' }
];

const statusTone = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  invisible: 'bg-amber-400'
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
};

const formatDashboardDate = () => new Date().toLocaleDateString([], {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric'
});

const Dashboard = () => {
  const { user } = useAuth();
  const [recentActivity, setRecentActivity] = useState([]);
  const [starredConversations, setStarredConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);

      const [recentRes, favoritesRes] = await Promise.allSettled([
        api.get('/messages/recent'),
        api.get('/users/favorites')
      ]);

      if (!isMounted) {
        return;
      }

      const recentItems = recentRes.status === 'fulfilled' && Array.isArray(recentRes.value.data?.items)
        ? recentRes.value.data.items
        : [];
      const favoriteUsers = favoritesRes.status === 'fulfilled' && Array.isArray(favoritesRes.value.data?.users)
        ? favoritesRes.value.data.users
        : [];

      setRecentActivity(recentItems.length > 0 ? recentItems : dummyRecent);
      setStarredConversations(favoriteUsers.length > 0 ? favoriteUsers : dummyStarred);
      setLoading(false);
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const heroStats = useMemo(() => [
    { id: 'activity', label: 'Recent updates', value: recentActivity.length || dummyRecent.length },
    { id: 'starred', label: 'Starred chats', value: starredConversations.length || dummyStarred.length },
    { id: 'today', label: 'Today agenda', value: dummyUpcoming.length }
  ], [recentActivity.length, starredConversations.length]);

  return (
    <main className="box-border flex h-screen overflow-hidden p-3 transition-colors md:p-4">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-3.5 animate-fadeIn">
        <TopBar />
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3.5 lg:grid-cols-[320px_1fr]">
          <aside className="kura-card min-h-0 overflow-hidden p-4 lg:p-5">
            <div className="flex h-full min-h-0 gap-4">
              <SidebarRail settingsState={{ from: '/dashboard' }} />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-brand-700 to-blue-500 p-5 text-white shadow-soft">
                  <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                    <Sparkles size={13} /> Home
                  </p>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight">Your workspace at a glance</h2>
                  <p className="mt-2 text-sm text-white/80">Stay on top of conversations, favorites, and what is next.</p>
                </div>

                <div className="mt-4 grid gap-3">
                  {heroStats.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{item.label}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="min-h-0 overflow-y-auto pr-1">
            <div className="space-y-6 pb-6">
              <div className="rounded-[28px] bg-gradient-to-r from-blue-500 via-brand-600 to-indigo-600 p-6 text-white shadow-soft">
                <p className="text-sm font-medium text-blue-100">Workspace Home</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  {getGreeting()}, {user?.username || 'there'}
                </h1>
                <p className="mt-2 text-sm text-blue-100">{formatDashboardDate()}</p>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <section className="kura-card p-5 xl:col-span-1">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Latest five chats and message moments</p>
                    </div>
                    <span className="rounded-xl bg-brand-50 p-2 text-brand-600 dark:bg-brand-900/30 dark:text-brand-200">
                      <Activity size={16} />
                    </span>
                  </div>

                  <div className="space-y-3">
                    {!loading && recentActivity.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        No recent chats yet. Your latest messages will show up here.
                      </div>
                    )}

                    {recentActivity.map((item) => (
                      <article key={item._id} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{item.preview}</p>
                          </div>
                          <span className="rounded-xl bg-white p-2 text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                            <MessageCircleMore size={15} />
                          </span>
                        </div>
                        <p className="mt-3 text-xs font-medium uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">{item.timeLabel}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="kura-card p-5 xl:col-span-1">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Starred Conversations</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Priority people you keep close</p>
                    </div>
                    <span className="rounded-xl bg-amber-50 p-2 text-amber-500 dark:bg-amber-900/20 dark:text-amber-300">
                      <Star size={16} />
                    </span>
                  </div>

                  <div className="space-y-3">
                    {starredConversations.map((person) => (
                      <article key={person._id} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
                        <img
                          src={person.profilePic || `https://api.dicebear.com/8.x/initials/svg?seed=${person.username}`}
                          alt={person.username}
                          className="h-11 w-11 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{person.username}</p>
                            <span className={`h-2 w-2 rounded-full ${statusTone[person.status] || statusTone.offline}`} />
                          </div>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{person.bio || 'Favorite collaborator'}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="kura-card p-5 xl:col-span-1">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Upcoming</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Static schedule for the dashboard demo</p>
                    </div>
                    <span className="rounded-xl bg-blue-50 p-2 text-blue-500 dark:bg-blue-900/20 dark:text-blue-300">
                      <CalendarDays size={16} />
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dummyUpcoming.map((event) => (
                      <article key={event.id} className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-500 dark:text-blue-300">{event.time}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{event.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{event.room}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
