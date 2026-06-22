import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Organization, Channel, Message, Notification, ProtectionDialogData } from '@/types';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setOrganization: (organization) => set({ organization }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setLoading: (value) => set({ isLoading: value }),
      logout: () => set({ user: null, organization: null, isAuthenticated: false }),
    }),
    {
      name: 'chatguard-auth',
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

interface ChatState {
  channels: Channel[];
  activeChannel: Channel | null;
  messages: Message[];
  directMessages: Map<string, Message[]>;
  typingUsers: Map<string, string[]>;
  onlineUsers: Set<string>;

  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  setActiveChannel: (channel: Channel | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  setDirectMessages: (userId: string, messages: Message[]) => void;
  addTypingUser: (channelId: string, userId: string) => void;
  removeTypingUser: (channelId: string, userId: string) => void;
  setOnlineUsers: (userIds: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  channels: [],
  activeChannel: null,
  messages: [],
  directMessages: new Map(),
  typingUsers: new Map(),
  onlineUsers: new Set(),

  setChannels: (channels) => set({ channels }),
  addChannel: (channel) => set((state) => ({
    channels: [...state.channels, channel]
  })),
  setActiveChannel: (channel) => set({
    activeChannel: channel,
    messages: []
  }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    ),
  })),
  deleteMessage: (id) => set((state) => ({
    messages: state.messages.filter((m) => m.id !== id),
  })),
  setDirectMessages: (userId, messages) => {
    const directMessages = new Map(get().directMessages);
    directMessages.set(userId, messages);
    set({ directMessages });
  },
  addTypingUser: (channelId, userId) => {
    const typingUsers = new Map(get().typingUsers);
    const users = typingUsers.get(channelId) || [];
    if (!users.includes(userId)) {
      typingUsers.set(channelId, [...users, userId]);
      set({ typingUsers });
    }
  },
  removeTypingUser: (channelId, userId) => {
    const typingUsers = new Map(get().typingUsers);
    const users = typingUsers.get(channelId) || [];
    typingUsers.set(channelId, users.filter((id) => id !== userId));
    set({ typingUsers });
  },
  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),
  addOnlineUser: (userId) => {
    const onlineUsers = new Set(get().onlineUsers);
    onlineUsers.add(userId);
    set({ onlineUsers });
  },
  removeOnlineUser: (userId) => {
    const onlineUsers = new Set(get().onlineUsers);
    onlineUsers.delete(userId);
    set({ onlineUsers });
  },
}));

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + (notification.read ? 0 : 1),
  })),
  markAsRead: (id) => set((state) => {
    const notifications = state.notifications.map((n) =>
      n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
    );
    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    };
  }),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({
      ...n,
      read: true,
      read_at: n.read_at || new Date().toISOString()
    })),
    unreadCount: 0,
  })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));

interface UIState {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  protectionDialog: ProtectionDialogData | null;
  notificationPanelOpen: boolean;
  searchQuery: string;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  showProtectionDialog: (data: ProtectionDialogData) => void;
  hideProtectionDialog: () => void;
  setNotificationPanelOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  protectionDialog: null,
  notificationPanelOpen: false,
  searchQuery: '',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  showProtectionDialog: (data) => set({ protectionDialog: data }),
  hideProtectionDialog: () => set({ protectionDialog: null }),
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

interface RiskState {
  userRiskScores: Map<string, number>;
  organizationRiskIndex: number;
  recentIncidents: number;

  setUserRiskScore: (userId: string, score: number) => void;
  setOrganizationRiskIndex: (index: number) => void;
  setRecentIncidents: (count: number) => void;
}

export const useRiskStore = create<RiskState>()((set, get) => ({
  userRiskScores: new Map(),
  organizationRiskIndex: 0,
  recentIncidents: 0,

  setUserRiskScore: (userId, score) => {
    const userRiskScores = new Map(get().userRiskScores);
    userRiskScores.set(userId, score);
    set({ userRiskScores });
  },
  setOrganizationRiskIndex: (index) => set({ organizationRiskIndex: index }),
  setRecentIncidents: (count) => set({ recentIncidents: count }),
}));
