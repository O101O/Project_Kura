import { Ban, BellOff, Crown, Shield, Trash2, UserPlus, UserX, Users } from 'lucide-react';

const ProfilePanel = ({
  currentUser,
  selectedChat,
  onMuteToggle,
  onBlockToggle,
  onDeleteChat,
  actionLoading,
  onOpenAddMember,
  onMakeAdmin,
  onRemoveAdmin,
  onKickMember,
  onDeleteGroup,
  groupActionLoading
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
  const adminIds = [
    ...((selectedChat.admin || []).map((adminId) => String(adminId))),
    ...((selectedChat.adminDetails || []).map((adminUser) => String(adminUser._id)))
  ];
  const currentUserId = String(currentUser?._id || '');
  const canManageGroup = isGroup && (selectedChat.isAdmin || adminIds.includes(currentUserId));

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
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Members</h4>
            {canManageGroup && (
              <button
                type="button"
                onClick={onOpenAddMember}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-500"
              >
                <UserPlus size={12} /> Add Member
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(selectedChat.members || []).map((member) => {
              const isAdmin = adminIds.includes(String(member._id));
              const isCurrentUser = String(member._id) === currentUserId;

              return (
                <div key={member._id} className="rounded-xl border border-slate-200 px-3 py-3 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={member.profilePic || `https://api.dicebear.com/8.x/initials/svg?seed=${member.username}`}
                        alt={member.username}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{member.username}</span>
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">You</span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-1 text-[11px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                        <Shield size={12} /> Admin
                      </span>
                    )}
                  </div>

                  {canManageGroup && !isCurrentUser && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!isAdmin && (
                        <button
                          type="button"
                          onClick={() => onMakeAdmin(member)}
                          disabled={groupActionLoading}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-70 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
                        >
                          <Crown size={12} /> Make Admin
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onRemoveAdmin(member)}
                          disabled={groupActionLoading}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <Shield size={12} /> Remove Admin
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onKickMember(member)}
                        disabled={groupActionLoading}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-70 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                      >
                        <UserX size={12} /> Kick Member
                      </button>
                    </div>
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
        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            <p className="inline-flex items-center gap-2 font-medium">
              <Users size={16} /> Member count: {selectedChat.memberCount}
            </p>
          </div>

          {canManageGroup && (
            <button
              type="button"
              onClick={onDeleteGroup}
              disabled={groupActionLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-70 dark:border-red-900/50 dark:hover:bg-red-950/30"
            >
              <Trash2 size={16} /> Delete Group
            </button>
          )}
        </div>
      )}
    </aside>
  );
};

export default ProfilePanel;
