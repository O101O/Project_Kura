const FriendRequests = ({ requests, onRespond }) => {
  if (!requests.length) {
    return null;
  }

  return (
    <div className="kura-card p-3 md:p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Friend Requests</h3>
      <div className="space-y-2">
        {requests.map((request) => (
          <div
            key={request._id}
            className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/70"
          >
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{request.username}</span>
            <div className="flex gap-2">
              <button
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400"
                onClick={() => onRespond(request._id, 'accept')}
              >
                Accept
              </button>
              <button
                className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-400"
                onClick={() => onRespond(request._id, 'reject')}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendRequests;
