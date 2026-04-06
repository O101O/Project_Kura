import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import TopBar from '../components/layout/TopBar';
import ConversationList from '../components/chat/ConversationList';
import ChatArea from '../components/chat/ChatArea';
import ProfilePanel from '../components/chat/ProfilePanel';
import SettingsPanel from '../components/settings/SettingsPanel';

const ChatPage = () => {
  const { user, setUser, logout } = useAuth();
  const { socket, onlineUsers } = useSocket(user?._id);
  const location = useLocation();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [typing, setTyping] = useState(false);
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [mobileView, setMobileView] = useState('list');
  const [requestsOpen, setRequestsOpen] = useState(true);
  const [requestActionLoading, setRequestActionLoading] = useState({});
  const [friendStatuses, setFriendStatuses] = useState({});
  const [deletedChatIds, setDeletedChatIds] = useState([]);
  const [profileActionLoading, setProfileActionLoading] = useState(false);
  const [groupActionLoading, setGroupActionLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);
  const [isDeleteGroupOpen, setIsDeleteGroupOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    members: [],
    groupPic: null
  });

  const feedbackTimerRef = useRef(null);
  const latestSearchReqRef = useRef(0);
  const isSettingsRoute = location.pathname === '/settings';
  const settingsState = useMemo(() => ({ from: location.pathname }), [location.pathname]);
  const settingsReturnTo = location.state?.from || '/chat';

  const showFeedback = useCallback((message, duration = 2000) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(message);
    feedbackTimerRef.current = setTimeout(() => setFeedback(''), duration);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const filteredFriends = useMemo(
    () => friends
      .filter((friend) => !deletedChatIds.includes(friend._id))
      .filter((friend) => friend.username.toLowerCase().includes(search.toLowerCase())),
    [friends, search, deletedChatIds]
  );

  const filteredGroups = useMemo(
    () => groups.filter((group) => group.name.toLowerCase().includes(search.toLowerCase())),
    [groups, search]
  );

  const fetchSidebarData = useCallback(async () => {
    try {
      const [friendsRes, pendingRes, groupsRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friend-request/pending'),
        api.get('/group')
      ]);

      const nextFriends = friendsRes.data.friends || [];
      const nextPending = pendingRes.data.pending || [];
      const nextGroups = groupsRes.data.groups || [];

      setFriends(nextFriends);
      setGroups(nextGroups);
      setPendingRequests(nextPending);
      setRequestActionLoading({});
      setFriendStatuses(
        nextFriends.reduce((acc, friend) => {
          acc[friend._id] = friend.status || 'online';
          return acc;
        }, {})
      );

      setSelectedChat((prev) => {
        if (prev?.type === 'direct' && nextFriends.some((friend) => friend._id === prev._id)) {
          return nextFriends.find((friend) => friend._id === prev._id) || prev;
        }
        if (prev?.type === 'group' && nextGroups.some((group) => group._id === prev._id)) {
          return nextGroups.find((group) => group._id === prev._id) || prev;
        }
        const firstFriend = nextFriends.find((friend) => !deletedChatIds.includes(friend._id));
        if (firstFriend) {
          return firstFriend;
        }
        if (nextGroups[0]) {
          return nextGroups[0];
        }
        if (prev && nextFriends.some((friend) => friend._id === prev._id)) {
          return prev;
        }
        return null;
      });
    } catch (_error) {
      showFeedback('Failed to load sidebar data', 2200);
    }
  }, [showFeedback, deletedChatIds]);

  const fetchMessages = useCallback(async (chat) => {
    try {
      if (!chat?._id) {
        setMessages([]);
        return;
      }

      const endpoint = chat.type === 'group' ? `/group/${chat._id}/messages` : `/messages/${chat._id}`;
      const { data } = await api.get(endpoint);
      const nextMessages = Array.isArray(data) ? data : (Array.isArray(data?.messages) ? data.messages : []);
      setMessages(nextMessages);
    } catch (error) {
      setMessages([]);
      console.error('fetchMessages error:', error);
      showFeedback(error.response?.data?.message || 'Failed to load messages', 2200);
    }
  }, [showFeedback]);

  useEffect(() => {
    fetchSidebarData();
  }, [fetchSidebarData]);

  useEffect(() => {
    const fetchUsers = async () => {
      const query = search.trim();

      if (!query) {
        setUserSearchResults([]);
        return;
      }

      const requestId = Date.now();
      latestSearchReqRef.current = requestId;

      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}`);

        if (latestSearchReqRef.current !== requestId) {
          return;
        }

        setUserSearchResults((data.users || []).slice(0, 8));
      } catch (_error) {
        if (latestSearchReqRef.current === requestId) {
          setUserSearchResults([]);
        }
      }
    };

    const id = setTimeout(fetchUsers, 250);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (selectedChat?._id) {
      fetchMessages(selectedChat);
      if (selectedChat.type === 'direct') {
        api.patch(`/messages/seen/${selectedChat._id}`).catch(() => {});
      }
    } else {
      setMessages([]);
    }
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onFriendRequestNew = ({ from }) => {
      showFeedback(`${from.username} sent you a friend request`, 2200);
      fetchSidebarData();
    };

    const onFriendRequestAccepted = ({ by }) => {
      showFeedback(`${by.username} accepted your friend request`, 2200);
      fetchSidebarData();
    };

    const onFriendRequestRejected = ({ by }) => {
      showFeedback(`${by.username} rejected your friend request`, 2200);
      fetchSidebarData();
    };

    const onFriendRequestUpdated = () => {
      fetchSidebarData();
    };

    const onStatusChanged = ({ userId, status }) => {
      setFriendStatuses((prev) => ({ ...prev, [userId]: status }));
      setFriends((prev) => prev.map((friend) => (friend._id === userId ? { ...friend, status } : friend)));
      setSelectedChat((prev) => prev?.type === 'direct' && prev._id === userId ? { ...prev, status } : prev);
    };

    const onGroupCreated = ({ group }) => {
      setGroups((prev) => prev.some((item) => item._id === group._id) ? prev : [group, ...prev]);
      socket.emit('group:join', group._id);
      showFeedback(`Group created: ${group.name}`, 2200);
    };

    const onGroupUpdated = ({ group }) => {
      if (group?._id) {
        socket.emit('group:join', group._id);
      }
      fetchSidebarData();
    };

    const onGroupRemoved = ({ groupId }) => {
      setGroups((prev) => prev.filter((group) => group._id !== groupId));
      setSelectedChat((prev) => (prev?.type === 'group' && prev._id === groupId ? null : prev));
      setMessages([]);
      setIsAddMemberOpen(false);
      setKickTarget(null);
      setIsDeleteGroupOpen(false);
      showFeedback('You were removed from the group', 2200);
    };

    socket.on('friend-request:new', onFriendRequestNew);
    socket.on('friend-request:accepted', onFriendRequestAccepted);
    socket.on('friend-request:rejected', onFriendRequestRejected);
    socket.on('friend-request:updated', onFriendRequestUpdated);
    socket.on('statusChanged', onStatusChanged);
    socket.on('status:changed', onStatusChanged);
    socket.on('group:created', onGroupCreated);
    socket.on('groupUpdated', onGroupUpdated);
    socket.on('groupRemoved', onGroupRemoved);

    return () => {
      socket.off('friend-request:new', onFriendRequestNew);
      socket.off('friend-request:accepted', onFriendRequestAccepted);
      socket.off('friend-request:rejected', onFriendRequestRejected);
      socket.off('friend-request:updated', onFriendRequestUpdated);
      socket.off('statusChanged', onStatusChanged);
      socket.off('status:changed', onStatusChanged);
      socket.off('group:created', onGroupCreated);
      socket.off('groupUpdated', onGroupUpdated);
      socket.off('groupRemoved', onGroupRemoved);
    };
  }, [socket, fetchSidebarData, showFeedback]);

  useEffect(() => {
    if (!socket || groups.length === 0) {
      return;
    }

    socket.emit('group:joinMany', groups.map((group) => group._id));
  }, [socket, groups]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onNewMessage = (incomingMessage) => {
      const isCurrentChat = selectedChat?.type === 'direct' && incomingMessage.sender === selectedChat._id;
      if (isCurrentChat) {
        setMessages((prev) => [...prev, incomingMessage]);
        return;
      }

      const senderFriend = friends.find((friend) => friend._id === incomingMessage.sender);
      if (senderFriend && !senderFriend.isMuted && user?.notifications?.messages) {
        showFeedback(`New message from ${senderFriend.username}`, 1800);
      }
    };

    const onTypingStart = ({ from }) => {
      if (selectedChat?.type === 'direct' && from === selectedChat._id) {
        setIsRemoteTyping(true);
      }
    };

    const onTypingStop = ({ from }) => {
      if (selectedChat?.type === 'direct' && from === selectedChat._id) {
        setIsRemoteTyping(false);
      }
    };

    const onNewGroupMessage = (incomingMessage) => {
      const messageGroupId = incomingMessage.groupId;
      const currentGroup = selectedChat?.type === 'group' ? selectedChat._id : null;

      if (currentGroup && String(messageGroupId) === String(currentGroup)) {
        setMessages((prev) => prev.some((message) => message._id === incomingMessage._id) ? prev : [...prev, incomingMessage]);
        return;
      }

      const group = groups.find((item) => String(item._id) === String(messageGroupId));
      if (group && user?.notifications?.messages) {
        showFeedback(`New group message in ${group.name}`, 1800);
      }
    };

    socket.on('message:new', onNewMessage);
    socket.on('newGroupMessage', onNewGroupMessage);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('newGroupMessage', onNewGroupMessage);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [socket, selectedChat, friends, groups, showFeedback, user?.notifications?.messages]);

  useEffect(() => {
    if (!socket || !selectedChat || selectedChat.type !== 'direct') {
      return;
    }

    if (typing) {
      socket.emit('typing:start', { from: user._id, to: selectedChat._id });
      const timeout = setTimeout(() => {
        setTyping(false);
        socket.emit('typing:stop', { from: user._id, to: selectedChat._id });
      }, 900);

      return () => clearTimeout(timeout);
    }
  }, [typing, socket, selectedChat, user?._id]);

  const syncSelectedDirectChat = useCallback((chatId, updater) => {
    setFriends((prev) => prev.map((friend) => (
      friend._id === chatId ? { ...friend, ...updater(friend) } : friend
    )));

    setSelectedChat((prev) => {
      if (!prev || prev.type !== 'direct' || prev._id !== chatId) {
        return prev;
      }

      return {
        ...prev,
        ...updater(prev)
      };
    });
  }, []);

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!selectedChat || !draft.trim()) {
      return;
    }

    try {
      const { data } = selectedChat.type === 'group'
        ? await api.post('/group/message', {
          groupId: selectedChat._id,
          text: draft
        })
        : await api.post('/messages', {
          receiverId: selectedChat._id,
          text: draft
        });

      setMessages((prev) => [...prev, data.message]);
      if (selectedChat.type === 'direct') {
        socket?.emit('message:send', { to: selectedChat._id, message: data.message });
      }
      setDraft('');
      setTyping(false);
      if (selectedChat.type === 'direct') {
        socket?.emit('typing:stop', { from: user._id, to: selectedChat._id });
      }
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Failed to send message', 2000);
    }
  };

  const onUpload = async (event) => {
    if (!selectedChat || !event.target.files?.[0]) {
      return;
    }

    const dataForm = new FormData();
    if (selectedChat.type === 'group') {
      dataForm.append('groupId', selectedChat._id);
    } else {
      dataForm.append('receiverId', selectedChat._id);
    }
    dataForm.append('text', draft.trim());
    dataForm.append('image', event.target.files[0]);

    try {
      const { data } = await api.post(selectedChat.type === 'group' ? '/group/message' : '/messages', dataForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessages((prev) => [...prev, data.message]);
      if (selectedChat.type === 'direct') {
        socket?.emit('message:send', { to: selectedChat._id, message: data.message });
      }
      setDraft('');
      event.target.value = '';
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Failed to upload image', 2000);
    }
  };

  const respondToRequest = async (requesterId, action) => {
    try {
      setRequestActionLoading((prev) => ({ ...prev, [requesterId]: true }));

      const endpoint = action === 'accept' ? '/friend-request/accept' : '/friend-request/reject';
      const { data } = await api.post(`${endpoint}/${requesterId}`);

      if (action === 'accept' && data.friend) {
        setFriends((prev) => {
          if (prev.some((item) => item._id === data.friend._id)) {
            return prev;
          }
          return [data.friend, ...prev];
        });
        setSelectedChat((prev) => prev || data.friend);
        setMobileView('chat');
        showFeedback('Friend request accepted', 1800);
      } else if (action === 'reject') {
        showFeedback('Friend request rejected', 1800);
      }

      setPendingRequests((prev) => prev.filter((item) => item._id !== requesterId));
      setUserSearchResults((prev) =>
        prev.map((userItem) =>
          userItem._id === requesterId
            ? { ...userItem, relationship: action === 'accept' ? 'friends' : 'none' }
            : userItem
        )
      );

      fetchSidebarData();
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Failed to update friend request', 2200);
    } finally {
      setRequestActionLoading((prev) => {
        const next = { ...prev };
        delete next[requesterId];
        return next;
      });
    }
  };

  const sendFriendRequest = async (recipientId) => {
    try {
      setRequestActionLoading((prev) => ({ ...prev, [recipientId]: true }));
      const { data } = await api.post(`/friend-request/send/${recipientId}`);

      if (data.autoAccepted && data.friend) {
        setFriends((prev) => {
          if (prev.some((item) => item._id === data.friend._id)) {
            return prev;
          }
          return [data.friend, ...prev];
        });
        setUserSearchResults((prev) =>
          prev.map((userItem) =>
            userItem._id === recipientId ? { ...userItem, relationship: 'friends' } : userItem
          )
        );
        showFeedback('Friend request accepted', 1800);
      } else {
        setUserSearchResults((prev) =>
          prev.map((userItem) =>
            userItem._id === recipientId ? { ...userItem, relationship: 'pending' } : userItem
          )
        );
        showFeedback('Friend request sent', 1800);
      }

      fetchSidebarData();
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Failed to send request', 2200);
    } finally {
      setRequestActionLoading((prev) => {
        const next = { ...prev };
        delete next[recipientId];
        return next;
      });
    }
  };

  const handleMuteToggle = async () => {
    if (!selectedChat || selectedChat.type !== 'direct') {
      return;
    }

    try {
      setProfileActionLoading(true);
      const endpoint = selectedChat.isMuted ? `/user/unmute/${selectedChat._id}` : `/user/mute/${selectedChat._id}`;
      const { data } = await api.post(endpoint);
      setUser(data.user);
      syncSelectedDirectChat(selectedChat._id, () => ({ isMuted: !selectedChat.isMuted }));
      showFeedback(data.message, 1800);
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Failed to update mute setting', 2000);
    } finally {
      setProfileActionLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!selectedChat || selectedChat.type !== 'direct') {
      return;
    }

    try {
      setProfileActionLoading(true);
      const endpoint = selectedChat.isBlocked ? `/user/unblock/${selectedChat._id}` : `/user/block/${selectedChat._id}`;
      const { data } = await api.post(endpoint);
      setUser(data.user);
      syncSelectedDirectChat(selectedChat._id, () => ({
        isBlocked: !selectedChat.isBlocked,
        status: !selectedChat.isBlocked ? 'offline' : selectedChat.status
      }));
      fetchSidebarData();
      showFeedback(data.message, 1800);
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Failed to update block setting', 2000);
    } finally {
      setProfileActionLoading(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat || selectedChat.type !== 'direct') {
      return;
    }

    try {
      setProfileActionLoading(true);
      await api.delete(`/messages/${selectedChat._id}`);
      setDeletedChatIds((prev) => prev.includes(selectedChat._id) ? prev : [...prev, selectedChat._id]);
      setMessages([]);
      setSelectedChat(null);
      setIsDeleteConfirmOpen(false);
      showFeedback('Chat deleted', 1800);
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Failed to delete chat', 2000);
    } finally {
      setProfileActionLoading(false);
    }
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();

    if (!groupForm.name.trim()) {
      showFeedback('Group name is required', 1800);
      return;
    }

    try {
      setProfileActionLoading(true);
      const formData = new FormData();
      formData.append('name', groupForm.name.trim());
      formData.append('members', JSON.stringify(groupForm.members));
      if (groupForm.groupPic) {
        formData.append('groupPic', groupForm.groupPic);
      }

      const { data } = await api.post('/group/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setGroups((prev) => prev.some((group) => group._id === data.group._id) ? prev : [data.group, ...prev]);
      setSelectedChat(data.group);
      setMessages([]);
      setIsCreateGroupOpen(false);
      setGroupForm({ name: '', members: [], groupPic: null });
      socket?.emit('group:join', data.group._id);
      showFeedback('Group created successfully', 1800);
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Failed to create group', 2200);
    } finally {
      setProfileActionLoading(false);
    }
  };

  const availableGroupFriends = useMemo(() => {
    if (selectedChat?.type !== 'group') {
      return [];
    }

    const memberIds = new Set((selectedChat.members || []).map((member) => member._id));
    return friends.filter((friend) => !memberIds.has(friend._id));
  }, [friends, selectedChat]);

  const updateGroupRole = async (endpoint, memberId, successMessage) => {
    if (!selectedChat || selectedChat.type !== 'group') {
      return;
    }

    try {
      setGroupActionLoading(true);
      const { data } = await api.post(`/group/${selectedChat._id}/${endpoint}`, { userId: memberId });
      setGroups((prev) => prev.map((group) => (group._id === data.group._id ? data.group : group)));
      setSelectedChat((prev) => (prev?.type === 'group' && prev._id === data.group._id ? data.group : prev));
      showFeedback(successMessage, 1800);
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Failed to update group', 2200);
    } finally {
      setGroupActionLoading(false);
    }
  };

  const handleAddMember = async (memberId) => {
    if (!memberId) {
      return;
    }

    await updateGroupRole('add-member', memberId, 'User added');
    setIsAddMemberOpen(false);
  };

  const handleMakeAdmin = async (member) => {
    await updateGroupRole('make-admin', member._id, 'Admin updated');
  };

  const handleRemoveAdmin = async (member) => {
    await updateGroupRole('remove-admin', member._id, 'Admin updated');
  };

  const handleKickMember = async () => {
    if (!kickTarget) {
      return;
    }

    await updateGroupRole('remove-member', kickTarget._id, 'User removed');
    setKickTarget(null);
  };

  const handleDeleteGroup = async () => {
    if (!selectedChat || selectedChat.type !== 'group') {
      return;
    }

    try {
      setGroupActionLoading(true);
      await api.delete(`/group/${selectedChat._id}`);
      setGroups((prev) => prev.filter((group) => group._id !== selectedChat._id));
      setSelectedChat(null);
      setMessages([]);
      setIsDeleteGroupOpen(false);
      showFeedback('Group deleted', 1800);
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Failed to delete group', 2200);
    } finally {
      setGroupActionLoading(false);
    }
  };

  const canMessage = selectedChat?.type === 'group'
    ? true
    : Boolean(selectedChat) && !selectedChat?.isBlocked && !selectedChat?.hasBlockedYou;
  const blockedMessage = selectedChat?.hasBlockedYou ? 'You cannot message this user' : 'Messaging is disabled';

  return (
    <main className="box-border flex h-screen overflow-hidden p-3 transition-colors md:p-4">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-3.5 animate-fadeIn">
        <TopBar />
        {feedback && (
          <div className="kura-card rounded-xl border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-200">
            {feedback}
          </div>
        )}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3.5 lg:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_300px]">
          <div className={`${mobileView === 'chat' ? 'hidden lg:block' : 'block'} min-h-0 h-full`}>
            <ConversationList
              friends={filteredFriends}
              groups={filteredGroups}
              selectedChat={selectedChat}
              setSelectedChat={(chat) => {
                setSelectedChat(chat);
                setMobileView('chat');
              }}
              onlineUsers={onlineUsers}
              friendStatuses={friendStatuses}
              search={search}
              setSearch={setSearch}
              userSearchResults={userSearchResults}
              onSendFriendRequest={sendFriendRequest}
              pendingRequests={pendingRequests}
              requestsOpen={requestsOpen}
              onToggleRequests={() => setRequestsOpen((prev) => !prev)}
              onRespondRequest={respondToRequest}
              requestActionLoading={requestActionLoading}
              settingsState={settingsState}
              onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            />
          </div>
          <div className={`${mobileView === 'list' ? 'hidden lg:block' : 'block'} min-h-0 h-full`}>
            <ChatArea
              currentUser={user}
              selectedChat={selectedChat}
              messages={messages}
              draft={draft}
              setDraft={setDraft}
              sendMessage={sendMessage}
              onUpload={onUpload}
              typing={isRemoteTyping}
              setTyping={setTyping}
              isFriendOnline={onlineUsers.includes(selectedChat?._id)}
              onBack={selectedChat ? () => setMobileView('list') : null}
              canMessage={canMessage}
              blockedMessage={blockedMessage}
            />
          </div>
          <ProfilePanel
            currentUser={user}
            selectedChat={selectedChat}
            onMuteToggle={handleMuteToggle}
            onBlockToggle={handleBlockToggle}
            onDeleteChat={() => setIsDeleteConfirmOpen(true)}
            actionLoading={profileActionLoading}
            onOpenAddMember={() => setIsAddMemberOpen(true)}
            onMakeAdmin={handleMakeAdmin}
            onRemoveAdmin={handleRemoveAdmin}
            onKickMember={(member) => setKickTarget(member)}
            onDeleteGroup={() => setIsDeleteGroupOpen(true)}
            groupActionLoading={groupActionLoading}
          />
        </div>
      </div>

      {isAddMemberOpen && selectedChat?.type === 'group' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="kura-card w-full max-w-md p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add Member</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select a friend to add to {selectedChat.name}.</p>
            <div className="mt-5 max-h-80 space-y-2 overflow-y-auto">
              {availableGroupFriends.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  All of your friends are already in this group.
                </div>
              ) : (
                availableGroupFriends.map((friend) => (
                  <button
                    key={friend._id}
                    type="button"
                    onClick={() => handleAddMember(friend._id)}
                    disabled={groupActionLoading}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-left hover:bg-slate-50 disabled:opacity-70 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={friend.profilePic || `https://api.dicebear.com/8.x/initials/svg?seed=${friend.username}`}
                        alt={friend.username}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{friend.username}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{friend.bio || 'Friend available to add'}</p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white">Add</span>
                  </button>
                ))
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
                onClick={() => setIsAddMemberOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {kickTarget && selectedChat?.type === 'group' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="kura-card w-full max-w-md p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Remove Member</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Are you sure you want to remove {kickTarget.username} from {selectedChat.name}?</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
                onClick={() => setKickTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={groupActionLoading}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                onClick={handleKickMember}
              >
                {groupActionLoading ? 'Removing...' : 'Kick Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteGroupOpen && selectedChat?.type === 'group' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="kura-card w-full max-w-md p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Delete Group</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This will permanently remove {selectedChat.name} and all of its messages for every member.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
                onClick={() => setIsDeleteGroupOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={groupActionLoading}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                onClick={handleDeleteGroup}
              >
                {groupActionLoading ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="kura-card w-full max-w-lg p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Group</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose a name, add members, and optionally upload a group image.</p>
            <form className="mt-5 space-y-4" onSubmit={handleCreateGroup}>
              <input
                value={groupForm.name}
                onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value }))}
                className="kura-input"
                placeholder="Group name"
                required
              />
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                <span>{groupForm.groupPic ? groupForm.groupPic.name : 'Upload group image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setGroupForm((prev) => ({ ...prev, groupPic: event.target.files?.[0] || null }))}
                />
              </label>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                {friends.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Add friends first to create a group.</p>
                ) : (
                  friends.map((friend) => (
                    <label key={friend._id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={groupForm.members.includes(friend._id)}
                        onChange={(event) => setGroupForm((prev) => ({
                          ...prev,
                          members: event.target.checked
                            ? [...prev.members, friend._id]
                            : prev.members.filter((id) => id !== friend._id)
                        }))}
                      />
                      <img
                        src={friend.profilePic || `https://api.dicebear.com/8.x/initials/svg?seed=${friend.username}`}
                        alt={friend.username}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{friend.username}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Duplicate members are prevented automatically.</p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  onClick={() => setIsCreateGroupOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileActionLoading}
                  className="rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {profileActionLoading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && selectedChat?.type === 'direct' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="kura-card w-full max-w-md p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Delete Chat</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Are you sure you want to delete this conversation? This will remove all messages between both users.</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={profileActionLoading}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                onClick={handleDeleteChat}
              >
                {profileActionLoading ? 'Deleting...' : 'Delete Chat'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsPanel
        open={isSettingsRoute}
        onClose={() => navigate(settingsReturnTo)}
        user={user}
        setUser={setUser}
        socket={socket}
        onLogout={logout}
      />
    </main>
  );
};

export default ChatPage;
