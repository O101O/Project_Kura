import { Search, Users, UserRoundPlus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserCard from '../components/UserCard';
import SidebarRail from '../components/layout/SidebarRail';
import TopBar from '../components/layout/TopBar';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../utils/api';
import { APP_ROUTES } from '../utils/constants';

const applyPresence = (users, onlineUsers) => users.map((user) => ({
  ...user,
  isOnline: onlineUsers.includes(user._id),
  online: onlineUsers.includes(user._id),
  status: onlineUsers.includes(user._id) ? 'online' : 'offline'
}));

const filterBySearch = (users, query) => {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return users;
  }

  return users.filter((user) => {
    const haystacks = [user.name, user.username, user.bio].filter(Boolean).join(' ').toLowerCase();
    return haystacks.includes(normalized);
  });
};

const ContactsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { onlineUsers } = useSocket(user?._id);
  const [friends, setFriends] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [requestStates, setRequestStates] = useState({});
  const [feedback, setFeedback] = useState('');
  const feedbackTimerRef = useRef(null);

  const showFeedback = useCallback((message) => {
    setFeedback(message);
    window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(''), 2200);
  }, []);

  const loadContacts = useCallback(async () => {
    setLoading(true);

    try {
      const [friendsRes, suggestedRes, pendingRes] = await Promise.all([
        api.get('/user/friends'),
        api.get('/user/suggestions'),
        api.get('/friend-request/pending')
      ]);

      const nextFriends = friendsRes.data?.friends || [];
      const nextSuggested = suggestedRes.data?.suggested || [];
      const nextPending = pendingRes.data?.pending || [];

      setFriends(nextFriends);
      setSuggested(nextSuggested);
      setIncomingRequests(nextPending);
      setRequestStates((prev) => {
        const nextState = { ...prev };

        nextSuggested.forEach((entry) => {
          if (entry.requestSent) {
            nextState[entry._id] = 'sent';
          }
          if (entry.hasIncomingRequest) {
            nextState[entry._id] = 'incoming';
          }
        });

        return nextState;
      });
    } catch (_error) {
      showFeedback('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    loadContacts();

    return () => {
      window.clearTimeout(feedbackTimerRef.current);
    };
  }, [loadContacts]);

  useEffect(() => {
    setFriends((prev) => applyPresence(prev, onlineUsers));
    setSuggested((prev) => applyPresence(prev, onlineUsers));
    setIncomingRequests((prev) => applyPresence(prev, onlineUsers));
  }, [onlineUsers]);

  const sendRequest = async (userId) => {
    setRequestStates((prev) => ({ ...prev, [userId]: 'loading' }));

    try {
      const { data } = await api.post(`/user/add-friend/${userId}`);

      if (data?.autoAccepted) {
        setRequestStates((prev) => ({ ...prev, [userId]: 'accepted' }));
        await loadContacts();
        showFeedback('Friend request accepted');
        return;
      }

      setRequestStates((prev) => ({ ...prev, [userId]: 'sent' }));
      setSuggested((prev) => prev.map((entry) => (
        entry._id === userId ? { ...entry, requestSent: true } : entry
      )));
      showFeedback('Friend request sent');
    } catch (error) {
      const message = error.response?.data?.message || 'Could not send friend request';
      setRequestStates((prev) => ({ ...prev, [userId]: 'idle' }));
      showFeedback(message);
    }
  };

  const acceptRequest = async (userId) => {
    setRequestStates((prev) => ({ ...prev, [userId]: 'loading' }));

    try {
      await api.post(`/user/accept/${userId}`);
      setRequestStates((prev) => ({ ...prev, [userId]: 'accepted' }));
      await loadContacts();
      showFeedback('Friend request accepted');
    } catch (error) {
      setRequestStates((prev) => ({ ...prev, [userId]: 'idle' }));
      showFeedback(error.response?.data?.message || 'Could not accept request');
    }
  };

  const visibleFriends = useMemo(() => {
    const filtered = filterBySearch(friends, search);
    return onlineOnly ? filtered.filter((entry) => entry.isOnline) : filtered;
  }, [friends, onlineOnly, search]);

  const visibleSuggested = useMemo(() => {
    const filtered = filterBySearch(
      suggested.filter((entry) => requestStates[entry._id] !== 'incoming'),
      search
    );
    return onlineOnly ? filtered.filter((entry) => entry.isOnline) : filtered;
  }, [suggested, onlineOnly, requestStates, search]);

  const visibleIncoming = useMemo(() => {
    const filtered = filterBySearch(incomingRequests, search);
    return onlineOnly ? filtered.filter((entry) => entry.isOnline) : filtered;
  }, [incomingRequests, onlineOnly, search]);

  return (
    <main className="box-border flex h-screen overflow-hidden p-3 transition-colors md:p-4">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-3.5 animate-fadeIn">
        <TopBar />

        <section className="kura-card min-h-0 flex-1 overflow-hidden p-4 lg:p-5">
          <div className="flex h-full min-h-0 gap-4">
            <SidebarRail settingsState={{ from: APP_ROUTES.contacts }} />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pr-1">
              <div className="rounded-[2rem] bg-gradient-to-r from-white via-slate-50 to-blue-50 p-5 shadow-inner shadow-slate-200/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <Users size={13} /> Contacts
                    </p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Your people space</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                      Browse connections, discover new people, and manage requests with live presence updates.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row">
                    <label className="relative min-w-[260px]">
                      <Search className="pointer-events-none absolute left-4 top-3.5 text-slate-400" size={17} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="kura-input rounded-2xl bg-white/90 py-3 pl-11 pr-4"
                        placeholder="Search people..."
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setOnlineOnly((prev) => !prev)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        onlineOnly
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      {onlineOnly ? 'Showing Online Only' : 'Filter Online Only'}
                    </button>
                  </div>
                </div>
              </div>

              {feedback && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 animate-fadeIn dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {feedback}
                </div>
              )}

              <div className="mt-6 space-y-6 pb-4">
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Connections</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Friends who are ready to chat right now.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {visibleFriends.length} people
                    </span>
                  </div>

                  {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={`friend-skeleton-${index}`} className="kura-card h-44 animate-pulse bg-slate-100/80 dark:bg-slate-800/70" />
                      ))}
                    </div>
                  ) : visibleFriends.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                      No connections match this view yet.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {visibleFriends.map((entry) => (
                        <div key={entry._id} onClick={() => navigate(APP_ROUTES.chat, { state: { selectedChatId: entry._id } })} className="cursor-pointer">
                          <UserCard user={entry} isFriend />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Friend Requests</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Accept incoming invitations from people who want to connect.</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {visibleIncoming.length} pending
                    </span>
                  </div>

                  {visibleIncoming.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                      No incoming requests right now.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {visibleIncoming.map((entry) => (
                        <UserCard
                          key={entry._id}
                          user={entry}
                          isRequest
                          requestState={requestStates[entry._id]}
                          onAcceptRequest={acceptRequest}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Suggested Users</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">People you may want to add, inspired by your current network.</p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <UserRoundPlus size={13} className="mr-1 inline" />
                      Discover
                    </span>
                  </div>

                  {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={`suggested-skeleton-${index}`} className="kura-card h-44 animate-pulse bg-slate-100/80 dark:bg-slate-800/70" />
                      ))}
                    </div>
                  ) : visibleSuggested.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                      No suggestions available for this filter.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {visibleSuggested.map((entry) => (
                        <UserCard
                          key={entry._id}
                          user={entry}
                          requestState={requestStates[entry._id]}
                          onSendRequest={sendRequest}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ContactsPage;
