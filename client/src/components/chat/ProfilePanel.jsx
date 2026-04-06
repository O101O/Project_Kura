import { Ban, BellOff, Shield, Trash2, Users } from 'lucide-react';

const ProfilePanel = ({
  selectedChat,
  onMuteToggle,
  onBlockToggle,
  onDeleteChat,
  actionLoading
}) => {
  if (!selectedChat) {
    return (
      <aside className="kura-card hidden h-full overflow-y-auto p-5 xl:block">
        <p className="text-sm text-slate-500 dark:text-slate-300">Conversation profile will appear here.</p>
      </aside>
    );
  }

  const media = selectedChat.media || [];
  const isGroup = selectedChat.type === 'group';

  return (
    <aside className="kura-card hidden h-full overflow-y-auto p-5 xl:block">
      <div className="text-center">
        <img
          src={(isGroup ? selectedChat.groupPic : selectedChat.profilePic) || `https://api.dicebear.com/8.x/initials/svg?seed=${isGroup ? selectedChat.name : selectedChat.username}`}
          alt={isGroup ? selectedChat.name : selectedChat.username}
          className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-brand-100 dark:ring-brand-900/40"
        />
        <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{isGroup ? selectedChat.name : selectedChat.username}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {isGroup ? `${selectedChat.memberCount} members` : selectedChat.bio || 'No bio yet.'}
        </p>
      </div>

      {isGroup && (
        <div className="mt-6">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Members</h4>
          <div className="space-y-2">
            {(selectedChat.members || []).map((member) => {
              const isAdmin = String(selectedChat.admin) === String(member._id);

              return (
                <div key={member._id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <img
                      src={member.profilePic || `https://api.dicebear.com/8.x/initials/svg?seed=${member.username}`}
                      alt={member.username}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{member.username}</span>
                  </div>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-1 text-[11px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      <Shield size={12} /> Admin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Media</h4>
        <div className="grid grid-cols-3 gap-2">
          {media.length > 0 ? (
            media.map((item) => <img key={item} src={item} alt="media" className="h-16 w-full rounded-xl object-cover" />)
          ) : (
            <p className="col-span-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800">No shared media yet.</p>
          )}
        </div>
      </div>

      {!isGroup && (
        <div className="mt-6 space-y-2">
          <button
            onClick={onMuteToggle}
            disabled={actionLoading}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-70 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <BellOff size={16} /> {selectedChat.isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button
            onClick={onBlockToggle}
            disabled={actionLoading}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-70 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Ban size={16} /> {selectedChat.isBlocked ? 'Unblock' : 'Block'}
          </button>
          <button
            onClick={onDeleteChat}
            disabled={actionLoading}
            className="flex w-full items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-70 dark:border-red-800 dark:hover:bg-red-950/40"
          >
            <Trash2 size={16} /> Delete chat
          </button>
        </div>
      )}

      {isGroup && (
        <div className="mt-6 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
          <p className="inline-flex items-center gap-2 font-medium">
            <Users size={16} /> Member count: {selectedChat.memberCount}
          </p>
        </div>
      )}
    </aside>
  );
};

export default ProfilePanel;
