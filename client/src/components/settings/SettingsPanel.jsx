import {
  Bell,
  CheckCircle2,
  CircleHelp,
  Loader2,
  Lock,
  Palette,
  ShieldAlert,
  TriangleAlert,
  User,
  UserRoundCog,
  Workflow,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';
import ToggleSwitch from '../common/ToggleSwitch';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'integrations', label: 'Integrations', icon: Workflow },
  { id: 'account', label: 'Account', icon: UserRoundCog },
  { id: 'status', label: 'Status', icon: CircleHelp },
  { id: 'support', label: 'Support', icon: CircleHelp },
  { id: 'danger', label: 'Danger Zone', icon: TriangleAlert }
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

// ToggleSwitch component imported from ../common/ToggleSwitch

const SettingsPanel = ({ open, onClose, user, setUser, socket, onLogout }) => {
  const location = useLocation();
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

  const avatarSrc = useMemo(
    () => user?.profilePic || `https://api.dicebear.com/8.x/initials/svg?seed=${user?.username || 'User'}`,
    [user?.profilePic, user?.username]
  );

  useEffect(() => {
    if (open && location.state?.tab) {
      setActiveTab(location.state.tab);
      return;
    }

    if (open) {
      setActiveTab('profile');
    }
  }, [open, location.state]);

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

  const renderPlaceholder = (title, description) => (
    <SectionCard title={title} subtitle={description}>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
        This section is ready for the next settings update.
      </div>
    </SectionCard>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[3px] transition-opacity duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="kura-card relative flex h-[min(82vh,720px)] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-[0_30px_90px_-24px_rgba(15,23,42,0.45)] dark:border-slate-700/80 dark:bg-slate-900/95 animate-fadeIn">
          <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-slate-100 px-5 py-6 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 md:flex md:flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Settings</p>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/70">
              <img src={avatarSrc} alt={user?.username || 'User'} className="h-11 w-11 rounded-2xl object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.username || 'User'}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email || 'No email available'}</p>
              </div>
            </div>

            <nav className="mt-6 space-y-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-brand-700 to-blue-500 text-white shadow-lg shadow-indigo-200/70 dark:shadow-indigo-950/30'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-700">
              <div className="md:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="kura-input py-2"
                >
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
              </div>
              <div className="hidden md:block">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Settings</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage your account preferences</p>
              </div>
              <button className="kura-icon-btn" onClick={onClose}>
                <X size={18} />
              </button>
            </header>

            {toast && (
              <div className="mx-5 mt-4 animate-fadeIn rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} />{toast}</span>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {activeTab === 'profile' && (
              <SectionCard title="Profile" subtitle="Update your public identity and avatar.">
                <div className="flex items-center gap-3">
                  <img
                    src={avatarSrc}
                    alt="profile"
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-200 dark:ring-brand-900/40"
                  />
                  <label className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
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
                  className="kura-input min-h-28"
                  placeholder="Bio"
                />
                <button onClick={submitProfile} className="rounded-xl bg-gradient-to-r from-brand-700 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200/60 hover:from-brand-600 hover:to-blue-400">
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </SectionCard>
            )}

            {activeTab === 'appearance' && renderPlaceholder('Appearance', 'Theme and visual personalization controls.')}

            {activeTab === 'privacy' && renderPlaceholder('Privacy', 'Privacy visibility and personal safety settings.')}

            {activeTab === 'integrations' && renderPlaceholder('Integrations', 'Third-party connections and workflow tools.')}

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
                <button onClick={submitPassword} className="rounded-xl bg-gradient-to-r from-brand-700 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200/60 hover:from-brand-600 hover:to-blue-400">
                  {loading ? 'Saving...' : 'Change Password'}
                </button>
              </SectionCard>
            )}

            {activeTab === 'status' && (
              <SectionCard title="Status" subtitle="Control your availability visibility.">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {['online', 'offline', 'invisible'].map((value) => (
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
                <button onClick={saveStatus} className="rounded-xl bg-gradient-to-r from-brand-700 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200/60 hover:from-brand-600 hover:to-blue-400">
                  {loading ? 'Saving...' : 'Save Status'}
                </button>
              </SectionCard>
            )}

            {activeTab === 'notifications' && (
              <SectionCard title="Notifications" subtitle="Fine-tune how Kura notifies you.">
                <ToggleSwitch
                  checked={notifications.messages}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, messages: value }))}
                  label="Message notifications"
                  hint="Receive notifications for new messages"
                />
                <ToggleSwitch
                  checked={notifications.sounds}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, sounds: value }))}
                  label="Sound"
                  hint="Play sound on new activity"
                />
                <ToggleSwitch
                  checked={notifications.friendRequests}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, friendRequests: value }))}
                  label="Friend request alerts"
                  hint="Notify when someone sends a request"
                />
                <button onClick={saveNotifications} className="rounded-xl bg-gradient-to-r from-brand-700 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200/60 hover:from-brand-600 hover:to-blue-400">
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
                <button onClick={submitSupport} className="rounded-xl bg-gradient-to-r from-brand-700 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200/60 hover:from-brand-600 hover:to-blue-400">
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
          </section>
        </div>
      </div>

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
