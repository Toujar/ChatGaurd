import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Image,
  Smile,
  MoreVertical,
  Reply,
  Trash2,
  Edit,
  Copy,
  Forward,
  Hash,
  Lock,
  Users,
  Search,
  Plus,
  Shield,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChatStore, useUIStore, useAuthStore } from '@/store';
import { channelsApi, messagesApi, type ChannelResponse, type MessageResponse } from '@/lib/api';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';

const mockChannels = [
  { id: '1', name: 'general', type: 'public' as const, unread: 3, members: 24, sensitivity: 'normal' as const },
  { id: '2', name: 'engineering', type: 'public' as const, unread: 0, members: 12, sensitivity: 'normal' as const },
  { id: '3', name: 'announcements', type: 'public' as const, unread: 1, members: 45, sensitivity: 'sensitive' as const },
  { id: '4', name: 'leadership', type: 'private' as const, unread: 0, members: 5, sensitivity: 'confidential' as const },
];

const mockMessages: Message[] = [
  {
    id: '1',
    channel_id: '1',
    sender_id: 'u1',
    content: 'Hey team, just pushed the latest updates to the protection engine. Please review when you get a chance.',
    content_type: 'text',
    sensitivity_detected: false,
    protection_triggered: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    sender: { full_name: 'Alex Chen', avatar_url: null } as Message['sender'],
  },
  {
    id: '2',
    channel_id: '1',
    sender_id: 'u2',
    content: 'Looking good! I noticed the risk score calculation is now much more accurate.',
    content_type: 'text',
    sensitivity_detected: false,
    protection_triggered: false,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    sender: { full_name: 'Sarah Miller', avatar_url: null } as Message['sender'],
  },
  {
    id: '3',
    channel_id: '1',
    sender_id: 'u3',
    content: 'Credit card: 4532-1234-5678-9010',
    content_type: 'text',
    sensitivity_detected: true,
    sensitivity_type: 'credit_card',
    protection_triggered: true,
    protection_type: 'sensitive_content',
    created_at: new Date(Date.now() - 900000).toISOString(),
    sender: { full_name: 'John Doe', avatar_url: null } as Message['sender'],
  },
  {
    id: '4',
    channel_id: '1',
    sender_id: 'current',
    content: 'I\'ll review the audit logs today. Can we sync up at 3pm?',
    content_type: 'text',
    sensitivity_detected: false,
    protection_triggered: false,
    created_at: new Date(Date.now() - 300000).toISOString(),
    sender: { full_name: 'You' } as Message['sender'],
  },
];

const onlineUsers = ['u1', 'u2'];

export function ChatPage() {
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState<ChannelResponse[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { showProtectionDialog } = useUIStore();

  // Load channels on mount
  useEffect(() => {
    channelsApi.list()
      .then((list) => {
        setChannels(list);
        if (list.length > 0) setSelectedChannel(list[0]);
      })
      .catch(console.error)
      .finally(() => setChannelsLoading(false));
  }, []);

  // Load messages when channel changes
  useEffect(() => {
    if (!selectedChannel) return;
    setMessagesLoading(true);
    messagesApi.getByChannel(selectedChannel.id, 0, 50)
      .then((page) => setMessages(page.content.reverse()))
      .catch(console.error)
      .finally(() => setMessagesLoading(false));
  }, [selectedChannel?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const detectSensitiveContent = (content: string): { detected: boolean; type: string | null } => {
    const patterns = {
      credit_card: /\b\d{4}[\\s-]?\d{4}[\\s-]?\d{4}[\\s-]?\d{4}\b/,
      ssn: /\b\d{3}[\\s-]?\d{2}[\\s-]?\d{4}\b/,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
      api_key: /\b[aA][pP][iI][_\-]?[kK][eE][yY][\s:=]+['"]?[\w-]+['"]?/,
      password: /\b[pP][aA][sS][sS][wW][oO][rR][dD][\s:=]+['"]?[\w-]+['"]?/,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(content)) {
        return { detected: true, type };
      }
    }
    return { detected: false, type: null };
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChannel) return;

    const { detected, type } = detectSensitiveContent(message);

    if (detected) {
      showProtectionDialog({
        type: 'sensitive_send',
        riskLevel: type === 'ssn' || type === 'credit_card' ? 'critical' : 'high',
        message: `Sensitive content detected: ${type?.replace('_', ' ')}. Are you sure you want to send this message?`,
        details: {
          content_preview: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          detection_type: type,
        },
        onConfirm: () => { sendToBackend(message); },
        onCancel: () => {},
      });
    } else {
      sendToBackend(message);
    }
  };

  const sendToBackend = async (content: string) => {
    if (!selectedChannel) return;
    try {
      const sent = await messagesApi.send({ channelId: selectedChannel.id, content });
      setMessages((prev) => [...prev, sent]);
      setMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6">
      {/* Channels Sidebar */}
      <Card className="hidden w-64 lg:flex flex-col">
        <CardHeader className="border-b border-border/50 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search channels" className="pl-9 h-9" />
          </div>
        </CardHeader>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {channelsLoading && <p className="px-3 py-2 text-xs text-muted-foreground">Loading…</p>}
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  selectedChannel?.id === channel.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {channel.type === 'PRIVATE' ? (
                  <Lock className="h-4 w-4 shrink-0" />
                ) : (
                  <Hash className="h-4 w-4 shrink-0" />
                )}
                <span className="flex-1 truncate text-left">{channel.name}</span>
                {channel.sensitivityLevel !== 'NORMAL' && (
                  <Shield className="h-3.5 w-3.5 text-warning" />
                )}
              </button>
            ))}
          </div>
          <button className="mt-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Plus className="h-4 w-4" />
            <span>Add channel</span>
          </button>
        </ScrollArea>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex flex-1 flex-col">
        {/* Channel Header */}
        <CardHeader className="border-b border-border/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                {selectedChannel?.type === 'PRIVATE' ? (
                  <Lock className="h-5 w-5 text-primary" />
                ) : (
                  <Hash className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{selectedChannel?.name ?? 'Select a channel'}</CardTitle>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {selectedChannel?.memberCount ?? 0} members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedChannel?.sensitivityLevel && selectedChannel.sensitivityLevel !== 'NORMAL' && (
                <Badge variant="warning" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {selectedChannel.sensitivityLevel.toLowerCase()}
                </Badge>
              )}
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-4">
            {messagesLoading && (
              <p className="text-center text-sm text-muted-foreground">Loading messages…</p>
            )}
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  'flex gap-3',
                  msg.senderId === user?.id && 'flex-row-reverse'
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={msg.senderAvatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(msg.senderName || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  'flex flex-col max-w-[70%]',
                  msg.senderId === user?.id ? 'items-end' : 'items-start'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{msg.senderName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(msg.createdAt)}
                    </span>
                    {msg.senderId === user?.id && (
                      <CheckCheck className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className={cn(
                    'rounded-2xl px-4 py-2.5',
                    msg.senderId === user?.id
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  )}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  {msg.protectionTriggered && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-warning">
                      <Shield className="h-3 w-3" />
                      Protected - Sensitive content detected
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t border-border/50 p-4">
          {isTyping && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-2 text-xs text-muted-foreground"
            >
              Someone is typing...
            </motion.p>
          )}
          <div className="flex items-end gap-3">
            <div className="flex flex-1 items-end gap-2 rounded-xl border border-input bg-background p-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Message #${selectedChannel?.name ?? ''}`}
                className="min-h-[40px] max-h-[200px] flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 p-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="flex items-center gap-1 pb-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Image className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={handleSendMessage} className="h-10 w-10 rounded-xl">
                <Send className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            Messages are protected by ChatGuard
          </p>
        </div>
      </Card>
    </div>
  );
}
