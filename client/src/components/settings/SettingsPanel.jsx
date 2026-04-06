import { CheckCircle2, Loader2, ShieldAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import api from '../../utils/api';

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'account', label: 'Account' },
  { id: 'status', label: 'Status' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'support', label: 'Support' },
  { id: 'danger', label: 'Danger Zone' }
];

const SectionCard = ({ title, subtitle, children, tone = 'default' }) => (
  <section
    className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 ${
      tone === 'danger'
        ? 'border-red-200/80 bg-red-50/50 dark:border-red-900/70 dark:bg-red-950/20'
        : 'border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-900/70'
    }`}
  >
    <h3 className={`text-sm font-semibold ${tone === 'danger' ? 'text-red-600 dark:text-red-300' : 'text-slate-800 dark:text-slate-100'}`}>
      {title}
    </h3>
    {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
    <div className="mt-4 space-y-3">{children}</div>
  </section>
);

const Toggle = ({ checked, onChange, label, hint }) => (
  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2.5 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800">
    <span>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </span>
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onChange(!checked);
      }}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
        checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  </label>
);

const SettingsPanel = ({ open, onClose, user, setUser, socket, onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    profilePic: null
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [statusValue, setStatusValue] = useState(user?.status || 'online');

  const [notifications, setNotifications] = useState({
    messages: user?.notifications?.messages ?? true,
    sounds: user?.notifications?.sounds ?? true,
    friendRequests: user?.notifications?.friendRequests ?? true
  });

  const [supportForm, setSupportForm] = useState({ subject: '', description: '' });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const panelClass = useMemo(
    () =>
      `fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-900 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`,
    [open]
  );

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  const submitProfile = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', profileForm.username);
      formData.append('bio', profileForm.bio);
      if (profileForm.profilePic) {
        formData.append('profilePic', profileForm.profilePic);
      }

      const { data } = await api.put('/user/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUser(data.user);
      showToast('Profile updated successfully');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showToast('New password and confirm password must match');
      return;
    }

    setLoading(true);
    try {
      await api.put('/user/change-password', passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      showToast('Password changed successfully');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const saveStatus = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/user/status', { status: statusValue });
      setUser((prev) => ({ ...prev, status: data.status }));
      socket?.emit('statusChanged', { userId: user?._id, status: data.status });
      showToast('Status updated');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/user/notifications', notifications);
      setUser(data.user);
      showToast('Notification preferences saved');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save notifications');
    } finally {
      setLoading(false);
    }
  };

  const submitSupport = async () => {
    if (!supportForm.subject.trim() || !supportForm.description.trim()) {
      showToast('Subject and description are required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/support/report', supportForm);
      setSupportForm({ subject: '', description: '' });
      showToast('Report submitted successfully');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete('/user/delete', { data: { confirmText: deleteConfirmText } });
      showToast('Account deleted');
      onLogout();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] transition-opacity duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside className={panelClass}>
        <div className="flex h-full flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Settings</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage your account preferences</p>
              </div>
              <button className="kura-icon-btn" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="mx-4 mt-3 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white shadow-md shadow-indigo-200/70 dark:shadow-indigo-900/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {toast && (
            <div className="mx-4 mt-3 animate-fadeIn rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} />{toast}</span>
            </div>
          )}

          <div className="mt-4 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
            {activeTab === 'profile' && (
              <SectionCard title="Profile" subtitle="Update your public identity and avatar.">
                <div className="flex items-center gap-3">
                  <img
                    src={user?.profilePic || `https://api.dicebear.com/8.x/initials/svg?seed=${user?.username || 'User'}`}
                    alt="profile"
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-200 dark:ring-brand-900/40"
                  />
                  <label className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                    Change avatar
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, profilePic: e.target.files?.[0] || null }))}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  value={profileForm.username}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))}
                  className="kura-input"
                  placeholder="Username"
                />
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                  className="kura-input min-h-24"
                  placeholder="Bio"
                />
                <button onClick={submitProfile} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </SectionCard>
            )}

            {activeTab === 'account' && (
              <SectionCard title="Account" subtitle="Password and account security settings.">
                <input value={user?.email || ''} readOnly className="kura-input opacity-70" />
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="kura-input"
                  placeholder="Current password"
                />
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="kura-input"
                  placeholder="New password"
                />
                <input
                  type="password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
                  className="kura-input"
                  placeholder="Confirm new password"
                />
                <button onClick={submitPassword} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
                  {loading ? 'Saving...' : 'Change Password'}
                </button>
              </SectionCard>
            )}

            {activeTab === 'status' && (
              <SectionCard title="Status" subtitle="Control your availability visibility.">
                <div className="grid grid-cols-2 gap-2">
                  {['online', 'invisible'].map((value) => (
                    <button
                      key={value}
                      onClick={() => setStatusValue(value)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                        statusValue === value
                          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <button onClick={saveStatus} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
                  {loading ? 'Saving...' : 'Save Status'}
                </button>
              </SectionCard>
            )}

            {activeTab === 'notifications' && (
              <SectionCard title="Notifications" subtitle="Fine-tune how Kura notifies you.">
                <Toggle
                  checked={notifications.messages}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, messages: value }))}
                  label="Message notifications"
                  hint="Receive notifications for new messages"
                />
                <Toggle
                  checked={notifications.sounds}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, sounds: value }))}
                  label="Sound"
                  hint="Play sound on new activity"
                />
                <Toggle
                  checked={notifications.friendRequests}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, friendRequests: value }))}
                  label="Friend request alerts"
                  hint="Notify when someone sends a request"
                />
                <button onClick={saveNotifications} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </SectionCard>
            )}

            {activeTab === 'support' && (
              <SectionCard title="Support" subtitle="Report issues directly to our support team.">
                <input
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, subject: e.target.value }))}
                  className="kura-input"
                  placeholder="Subject"
                />
                <textarea
                  value={supportForm.description}
                  onChange={(e) => setSupportForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="kura-input min-h-28"
                  placeholder="Describe the issue"
                />
                <button onClick={submitSupport} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </SectionCard>
            )}

            {activeTab === 'danger' && (
              <SectionCard title="Danger Zone" subtitle="These actions are irreversible." tone="danger">
                <button onClick={onLogout} className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  Logout
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  Delete Account
                </button>
              </SectionCard>
            )}
          </div>

          {loading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/30 dark:bg-slate-900/30">
              <Loader2 size={24} className="animate-spin text-brand-600" />
            </div>
          )}
        </div>
      </aside>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">
          <div className="kura-card w-full max-w-md p-5 animate-fadeIn">
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-red-600 dark:text-red-300">
              <ShieldAlert size={18} /> Confirm Account Deletion
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Type DELETE to confirm permanent deletion.</p>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="kura-input mt-3"
              placeholder="Type DELETE"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button
                className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                onClick={deleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || loading}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPanel;
