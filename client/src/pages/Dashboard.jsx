import { Activity, CalendarDays, MessageCircleMore, Plus, Sparkles, Star, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import SidebarRail from '../components/layout/SidebarRail';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { APP_ROUTES } from '../utils/constants';

const emptyState = [];

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
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    description: ''
  });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const toastTimer = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);

      const [recentRes, favoritesRes, eventsRes] = await Promise.allSettled([
        api.get('/messages/recent'),
        api.get('/conversations?starred=true'),
        api.get('/events')
      ]);

      if (!isMounted) {
        return;
      }

      const recentItems = recentRes.status === 'fulfilled' && Array.isArray(recentRes.value.data?.items)
        ? recentRes.value.data.items
        : emptyState;
      const favoriteConversations = favoritesRes.status === 'fulfilled' && Array.isArray(favoritesRes.value.data?.conversations)
        ? favoritesRes.value.data.conversations
        : emptyState;
      const eventsItems = eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value.data?.events)
        ? eventsRes.value.data.events
        : emptyState;

      setRecentActivity(recentItems);
      setStarredConversations(favoriteConversations);
      setEvents(eventsItems);
      setEventsLoading(false);
      setLoading(false);
    };

    loadDashboard();

    return () => {
      isMounted = false;
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const heroStats = useMemo(() => [
    { id: 'activity', label: 'Recent updates', value: recentActivity.length },
    { id: 'starred', label: 'Starred chats', value: starredConversations.length },
    { id: 'today', label: 'Today agenda', value: events.filter((event) => isToday(event.date)).length }
  ], [recentActivity.length, starredConversations.length, events]);

  const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);

  const handleEventChange = (event) => {
    const { name, value } = event.target;
    setEventForm((prev) => ({ ...prev, [name]: value }));
  };

  const pushToast = (message) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();

    try {
      const { data } = await api.post('/events', eventForm);
      setEvents((prev) => [...prev, data.event].sort(sortByDate));
      setEventForm({ title: '', date: '', time: '', description: '' });
      setEventsOpen(false);
      pushToast('Event created');
    } catch (error) {
      pushToast(error.response?.data?.message || 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await api.delete(`/events/${eventId}`);
      setEvents((prev) => prev.filter((entry) => entry._id !== eventId));
      pushToast('Event deleted');
    } catch (error) {
      pushToast(error.response?.data?.message || 'Failed to delete event');
    }
  };

  return (
    <main className="box-border flex h-screen overflow-hidden p-3 transition-colors md:p-4">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-3.5 animate-fadeIn">
        <TopBar />
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3.5 lg:grid-cols-[320px_1fr]">
          <aside className="kura-card min-h-0 overflow-hidden p-4 lg:p-5">
            <div className="flex h-full min-h-0 gap-4">
              <SidebarRail settingsState={{ from: APP_ROUTES.dashboard }} />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="rounded-3xl border border-brand-100/70 bg-[linear-gradient(135deg,rgba(245,239,255,0.98)_0%,rgba(234,242,255,0.98)_52%,rgba(236,255,252,0.98)_100%)] p-5 text-slate-900 shadow-[0_18px_50px_-30px_rgba(54,37,101,0.22)]">
                  <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700 shadow-sm">
                    <Sparkles size={13} /> Home
                  </p>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Quick workspace summary</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">A quieter snapshot of your activity, starred chats, and today’s agenda.</p>
                </div>

                <div className="mt-4 grid gap-3">
                  {heroStats.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/85 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/60">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">{item.label}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="min-h-0 overflow-y-auto pr-1">
            <div className="space-y-6 pb-6">
              <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#7b2ef6_0%,#4b59f0_48%,#18bfb7_100%)] p-6 text-white shadow-soft">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,24,0.12),rgba(12,10,24,0.04))]" />
                <div className="relative">
                  <p className="text-sm font-medium text-white/88 [text-shadow:0_1px_8px_rgba(0,0,0,0.18)]">Workspace Home</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight [text-shadow:0_2px_16px_rgba(0,0,0,0.22)]">
                    {getGreeting()}, {user?.username || 'there'}
                  </h1>
                  <p className="mt-2 text-sm text-white/88 [text-shadow:0_1px_8px_rgba(0,0,0,0.18)]">{formatDashboardDate()}</p>
                </div>
              </div>

              {toast && (
                <div className="kura-card rounded-xl border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
                  {toast}
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-3">
                <section className="kura-card p-5 xl:col-span-1">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300">Latest five chats and message moments</p>
                    </div>
                    <span className="rounded-xl bg-brand-50 p-2 text-brand-600 dark:bg-brand-900/30 dark:text-brand-200">
                      <Activity size={16} />
                    </span>
                  </div>

                  <div className="space-y-3">
                    {!loading && recentActivity.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        No recent chats yet. Your latest messages will show up here.
                      </div>
                    )}

                    {recentActivity.map((item) => (
                      <article key={item._id} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-slate-950 dark:text-slate-50">{item.title}</p>
                            <p className="mt-1.5 line-clamp-2 text-sm font-normal leading-6 text-slate-700 dark:text-slate-300">{item.preview}</p>
                          </div>
                          <span className="rounded-xl bg-white p-2.5 text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                            <MessageCircleMore size={15} />
                          </span>
                        </div>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-slate-600 dark:text-slate-300">{item.timeLabel}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="kura-card p-5 xl:col-span-1">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Starred Conversations</h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300">Priority people you keep close</p>
                    </div>
                    <span className="rounded-xl bg-amber-50 p-2 text-amber-500 dark:bg-amber-900/20 dark:text-amber-300">
                      <Star size={16} />
                    </span>
                  </div>

                  <div className="space-y-3">
                    {starredConversations.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        No starred chats yet.
                      </div>
                    )}
                    {starredConversations.map((conversation) => (
                      <article key={conversation._id} className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
                        <img
                          src={(conversation.type === 'group' ? conversation.groupPic : conversation.profilePic) || `https://api.dicebear.com/8.x/initials/svg?seed=${conversation.type === 'group' ? conversation.name : conversation.username}`}
                          alt={conversation.type === 'group' ? conversation.name : conversation.username}
                          className="h-12 w-12 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                              {conversation.type === 'group' ? conversation.name : conversation.username}
                            </p>
                            <span className={`h-2 w-2 rounded-full ${statusTone[conversation.status] || statusTone.offline}`} />
                          </div>
                          <p className="mt-1 truncate text-sm text-slate-700 dark:text-slate-300">
                            {conversation.lastPreview || (conversation.type === 'group' ? 'Starred group chat' : 'Starred contact')}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="kura-card p-5 xl:col-span-1">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Upcoming</h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300">Plan meetings, reminders, and chat follow-ups</p>
                    </div>
                    <span className="rounded-xl bg-[linear-gradient(135deg,rgba(245,239,255,0.9),rgba(232,249,255,0.9))] p-2 text-brand-600 dark:bg-blue-900/20 dark:text-blue-300">
                      <CalendarDays size={16} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                    <span>{eventsLoading ? 'Loading events...' : `${events.length} events scheduled`}</span>
                    <button
                      type="button"
                      onClick={() => setEventsOpen(true)}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                    >
                      <Plus size={14} /> Add Event
                    </button>
                  </div>

                  {eventsLoading ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      Loading calendar...
                    </div>
                  ) : events.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      No events yet. Add your first event.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {groupedEvents.map((group) => (
                        <div key={group.dateKey}>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                            {group.label}
                          </p>
                          <div className="space-y-2">
                            {group.items.map((event) => (
                              <article
                                key={event._id}
                                className={`rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800 ${
                                  isToday(event.date) ? 'ring-1 ring-brand-300/60' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-500 dark:text-blue-300">{event.time}</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">{event.title}</p>
                                    <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">{event.description || 'No description provided.'}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEvent(event._id)}
                                    className="rounded-xl border border-slate-200/80 p-2 text-slate-500 hover:border-rose-200 hover:text-rose-500 dark:border-slate-700"
                                    aria-label="Delete event"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </section>
        </div>
      </div>

      {eventsOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_30px_90px_-40px_rgba(54,37,101,0.45)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Add Event</h3>
              <button
                type="button"
                onClick={() => setEventsOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-brand-200 hover:text-brand-700"
              >
                Close
              </button>
            </div>
            <form className="space-y-3" onSubmit={handleCreateEvent}>
              <input
                className="kura-input bg-white/95"
                placeholder="Event title"
                name="title"
                value={eventForm.title}
                onChange={handleEventChange}
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  className="kura-input bg-white/95"
                  name="date"
                  value={eventForm.date}
                  onChange={handleEventChange}
                  required
                />
                <input
                  type="time"
                  className="kura-input bg-white/95"
                  name="time"
                  value={eventForm.time}
                  onChange={handleEventChange}
                  required
                />
              </div>
              <textarea
                className="kura-input bg-white/95"
                rows={4}
                placeholder="Description"
                name="description"
                value={eventForm.description}
                onChange={handleEventChange}
              />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#8d31ff_0%,#456cff_58%,#1dd9d2_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_22px_40px_-18px_rgba(69,108,255,0.55)] hover:-translate-y-0.5 hover:brightness-105"
              >
                Create Event
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;

const sortByDate = (a, b) => new Date(a.date) - new Date(b.date);

const isToday = (dateValue) => {
  const date = new Date(dateValue);
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
};

const groupEventsByDate = (items) => {
  const groups = items.reduce((acc, item) => {
    const date = new Date(item.date);
    const key = date.toISOString().split('T')[0];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  return Object.entries(groups)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([dateKey, groupItems]) => ({
      dateKey,
      label: new Date(dateKey).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
      items: groupItems.sort(sortByDate)
    }));
};
