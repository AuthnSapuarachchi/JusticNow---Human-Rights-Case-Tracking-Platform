import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { NotificationType } from '@/api/notificationsApi';

export function notificationIcon(type: NotificationType): ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'OFFICER_PENDING': return 'person-add-outline';
    case 'CASE_UNASSIGNED': return 'alert-circle-outline';
    case 'CASE_ASSIGNED': return 'folder-open-outline';
    case 'NEW_MESSAGE': return 'chatbubble-ellipses-outline';
    case 'ACCOUNT_APPROVED': return 'checkmark-circle-outline';
    default: return 'notifications-outline';
  }
}
