import { useEffect } from 'react';
import { useNotificationStore, useChatStore } from '@/store';
import type { Notification } from '@/types';

export function useNotificationsMock() {
  const { setNotifications, addNotification } = useNotificationStore();

  useEffect(() => {
    setNotifications([
      {
        id: '1',
        user_id: 'current',
        type: 'protection_alert',
        title: 'Sensitive content blocked',
        content: 'Credit card number detected in message from John Doe',
        data: {},
        read: false,
        created_at: new Date(Date.now() - 300000).toISOString(),
      } as Notification,
      {
        id: '2',
        user_id: 'current',
        type: 'message',
        title: 'New message in #general',
        content: 'Alex Chen: Hey team, just pushed the latest updates...',
        data: {},
        read: false,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      } as Notification,
      {
        id: '3',
        user_id: 'current',
        type: 'risk_alert',
        title: 'Risk score increased',
        content: 'User Mike Ross risk score increased to 78',
        data: {},
        read: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      } as Notification,
      {
        id: '4',
        user_id: 'current',
        type: 'system',
        title: 'New protection rule added',
        content: 'API Key Detection rule has been enabled',
        data: {},
        read: true,
        created_at: new Date(Date.now() - 7200000).toISOString(),
      } as Notification,
    ]);
  }, [setNotifications]);
}

export function useChannelsMock() {
  const { setChannels } = useChatStore();

  useEffect(() => {
    setChannels([
      {
        id: '1',
        organization_id: 'org1',
        name: 'general',
        description: 'Company-wide announcements',
        type: 'public',
        sensitivity_level: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        organization_id: 'org1',
        name: 'engineering',
        description: 'Engineering team discussions',
        type: 'public',
        sensitivity_level: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        organization_id: 'org1',
        name: 'announcements',
        description: 'Important company announcements',
        type: 'public',
        sensitivity_level: 'sensitive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '4',
        organization_id: 'org1',
        name: 'leadership',
        description: 'Leadership team private channel',
        type: 'private',
        sensitivity_level: 'confidential',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as any);
  }, [setChannels]);
}
