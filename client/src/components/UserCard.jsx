const getDisplayName = (user) => user?.name || user?.username || 'Unknown user';

const UserCard = ({
  user,
  isFriend = false,
  isRequest = false,
  onSendRequest,
  onAcceptRequest,
  requestState = 'idle'
}) => {
  const displayName = getDisplayName(user);
  const avatar = user?.profilePic || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
  const statusLabel = user?.isOnline ? 'Online' : 'Offline';
  const statusClasses = user?.isOnline
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300';

  return (
    <article className="kura-card group h-full p-5 animate-fadeIn transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-black/20">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <img src={avatar} alt={displayName} className="h-16 w-16 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-800" />
          <span className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${user?.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{displayName}</h3>
          <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500 dark:text-slate-400">
            {user?.bio || 'Kura collaborator'}
          </p>

          {typeof user?.mutualFriendsCount === 'number' && user.mutualFriendsCount > 0 && (
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              {user.mutualFriendsCount} mutual {user.mutualFriendsCount === 1 ? 'friend' : 'friends'}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses}`}>
          {statusLabel}
        </span>

        {isFriend && (
          <button className="rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02] dark:bg-slate-100 dark:text-slate-900">
            Message
          </button>
        )}

        {isRequest && (
          <button
            type="button"
            onClick={() => onAcceptRequest?.(user._id)}
            disabled={requestState === 'loading' || requestState === 'accepted'}
            className="rounded-xl bg-emerald-500 px-3.5 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {requestState === 'accepted' ? 'Accepted' : requestState === 'loading' ? 'Accepting...' : 'Accept'}
          </button>
        )}

        {!isFriend && !isRequest && (
          <button
            type="button"
            onClick={() => onSendRequest?.(user._id)}
            disabled={requestState === 'loading' || requestState === 'sent'}
            className="rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-3.5 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {requestState === 'sent' ? 'Request Sent' : requestState === 'loading' ? 'Sending...' : 'Add Friend'}
          </button>
        )}
      </div>
    </article>
  );
};

export default UserCard;
