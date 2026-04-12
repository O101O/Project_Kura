import { ChevronDown, Plus, Search, Star, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import SidebarRail from '../layout/SidebarRail';

const RelationshipAction = ({ user, onSendFriendRequest, onRespondRequest, requestActionLoading }) => {
  const isLoading = Boolean(requestActionLoading[user._id]);

  if (user.relationship === 'friends') {
    return <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Friends</span>;
  }

  if (user.relationship === 'pending') {
    return <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Pending</span>;
  }

  if (user.relationship === 'incoming') {
    return (
      <div className="flex items-center gap-1.5">
        <button
          className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-400 disabled:opacity-70"
          disabled={isLoading}
          onClick={() => onRespondRequest(user._id, 'accept')}
        >
          Accept
        </button>
        <button
          className="rounded-md bg-rose-500 px-2 py-1 text-xs font-medium text-white hover:bg-rose-400 disabled:opacity-70"
          disabled={isLoading}
          onClick={() => onRespondRequest(user._id, 'reject')}
        >
          Reject
        </button>
      </div>
    );
  }

  return (
    <button
      className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-500 disabled:opacity-70"
      disabled={isLoading}
      onClick={() => onSendFriendRequest(user._id)}
    >
      <UserPlus size={12} /> Add
    </button>
  );
};

const conversationSections = ['Recent', 'Unread', 'Groups'];

const getStatusLabel = (status, isOnline) => {
  if (status === 'invisible') {
    return 'Invisible';
  }
  if (status === 'offline') {
    return 'Offline';
  }
  return isOnline ? 'Online' : 'Offline';
};

const ConversationList = ({
  friends,
  groups,
  selectedChat,
  setSelectedChat,
  onlineUsers,
  friendStatuses,
  search,
  setSearch,
  userSearchResults,
  onSendFriendRequest,
  pendingRequests,
  requestsOpen,
  onToggleRequests,
  onRespondRequest,
  requestActionLoading,
  settingsState,
  onOpenCreateGroup,
  onToggleStar
}) => {
  const pendingCount = pendingRequests.length;
  const [activeSection, setActiveSection] = useState('Recent');

  const conversations = useMemo(() => {
    if (activeSection === 'Recent') {
      return [...groups, ...friends];
    }
    if (activeSection === 'Unread') {
      return [...friends, ...groups].filter((item) => (item.unreadCount || 0) > 0);
    }
    if (activeSection === 'Groups') {
      return groups;
    }
    return friends;
  }, [friends, groups, activeSection]);

  return (
    <aside className="kura-card h-full overflow-hidden p-4 lg:p-5">
      <div className="flex h-full min-h-0 gap-4">
        <SidebarRail settingsState={settingsState} />

        <div className="flex min-w-0 min-h-0 flex-1 flex-col">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Inbox</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-600 dark:text-brand-300">Kura</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenCreateGroup}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-200/50"
              >
                <Plus size={13} /> Create Group
              </button>
              {pendingCount > 0 && (
                <span className="rounded-full bg-rose-500 px-2 py-1 text-xs font-semibold text-white">{pendingCount}</span>
              )}
            </div>
          </div>

          <label className="relative mb-4 block">
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="kura-input py-2.5 pl-9 pr-3"
              placeholder="Search conversations..."
            />
          </label>

          {search.trim() && userSearchResults.length > 0 && (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Discover users</p>
              <div className="space-y-1.5">
                {userSearchResults.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-white dark:hover:bg-slate-800"
                  >
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{user.username}</span>
                    <RelationshipAction
                      user={user}
                      onSendFriendRequest={onSendFriendRequest}
                      onRespondRequest={onRespondRequest}
                      requestActionLoading={requestActionLoading}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {search.trim() && userSearchResults.length === 0 && (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
              No users found
            </div>
          )}

          <div className="mb-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onToggleRequests}
              className="flex w-full items-center justify-between px-3 py-2.5"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Users size={15} /> Friend Requests
                {pendingCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] text-white">{pendingCount}</span>
                )}
              </span>
              <ChevronDown
                size={16}
                className={`text-slate-500 transition-transform ${requestsOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {requestsOpen && (
              <div className="space-y-2 border-t border-slate-200 px-3 py-3 dark:border-slate-700">
                {pendingRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">No pending requests</p>
                ) : (
                  pendingRequests.map((request) => {
                    const isLoading = Boolean(requestActionLoading[request._id]);
                    return (
                      <div
                        key={request._id}
                        className="animate-fadeIn rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <img
                            src={request.profilePic || `https://api.dicebear.com/8.x/initials/svg?seed=${request.username}`}
                            alt={request.username}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{request.username}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            className="flex-1 rounded-md bg-emerald-500 px-2 py-1 text-xs font-medium text-white transition-all hover:bg-emerald-400 disabled:opacity-70"
                            disabled={isLoading}
                            onClick={() => onRespondRequest(request._id, 'accept')}
                          >
                            Accept
                          </button>
                          <button
                            className="flex-1 rounded-md bg-rose-500 px-2 py-1 text-xs font-medium text-white transition-all hover:bg-rose-400 disabled:opacity-70"
                            disabled={isLoading}
                            onClick={() => onRespondRequest(request._id, 'reject')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="mb-3">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Friends</h3>
            <div className="flex flex-wrap gap-2">
              {friends.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No friends yet</p>
              ) : (
                friends.slice(0, 10).map((friend) => (
                  <button
                    key={`friend-pill-${friend._id}`}
                    onClick={() => setSelectedChat(friend)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${onlineUsers.includes(friend._id) ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {friend.username}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="mb-2 flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {conversationSections.map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeSection === section
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {section}
              </button>
            ))}
          </div>

          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Conversations</h3>
          <div className="min-h-0 space-y-1.5 overflow-y-auto pr-1">
            {activeSection === 'Groups' && conversations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Group chats will appear here.
              </p>
            ) : conversations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {activeSection === 'Unread' ? 'No unread conversations.' : 'No conversations yet.'}
              </p>
            ) : (
              conversations.map((item) => {
                const isGroup = item.type === 'group';
                const isOnline = onlineUsers.includes(item._id);
                const selected = selectedChat?._id === item._id && selectedChat?.type === item.type;
                const friendStatus = friendStatuses[item._id] || item.status;
                const subtitle = isGroup
                  ? `${item.memberCount} member${item.memberCount === 1 ? '' : 's'}${item.isAdmin ? ' • Admin' : ''}`
                  : getStatusLabel(friendStatus, isOnline);

                return (
                  <div
                    key={`${item.type}-${item._id}`}
                    className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      selected
                        ? 'border-brand-200 bg-brand-50/80 shadow-sm dark:border-brand-700 dark:bg-brand-900/20'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <button type="button" onClick={() => setSelectedChat(item)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <div className="relative shrink-0">
                        <img
                          src={(isGroup ? item.groupPic : item.profilePic) || `https://api.dicebear.com/8.x/initials/svg?seed=${isGroup ? item.name : item.username}`}
                          alt={isGroup ? item.name : item.username}
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                        />
                        {!isGroup && isOnline && friendStatus !== 'invisible' && (
                          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{isGroup ? item.name : item.username}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleStar?.(item);
                      }}
                      className={`rounded-xl border px-2 py-2 text-slate-500 transition-colors hover:border-brand-200 hover:text-brand-600 ${
                        item.isStarred ? 'border-brand-200 bg-brand-50 text-brand-600' : 'border-transparent'
                      } ${item.conversationId ? '' : 'cursor-not-allowed opacity-50'}`}
                      aria-label={item.isStarred ? 'Unstar conversation' : 'Star conversation'}
                      disabled={!item.conversationId}
                    >
                      <Star size={16} className={item.isStarred ? 'fill-current' : ''} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ConversationList;
