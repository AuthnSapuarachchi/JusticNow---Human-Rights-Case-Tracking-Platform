import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { NotificationType } from '@/api/notificationsApi';

export function notificationIcon(type: NotificationType): ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'OFFICER_PENDING': return 'person-add-outline';
    case 'CASE_UNASSIGNED': return 'alert-circle-outline';
    case 'CASE_ASSIGNED': return 'folder-open-outline';
    case 'CASE_UPDATED': return 'reader-outline';
    case 'NEW_MESSAGE': return 'chatbubble-ellipses-outline';
    case 'ACCOUNT_APPROVED': return 'checkmark-circle-outline';
    case 'OFFICER_COMPLAINT': return 'flag-outline';
    case 'COMPLAINT_UPDATED': return 'flag-outline';
    case 'STAFF_MESSAGE': return 'shield-outline';
    case 'STAFF_WARNING': return 'warning-outline';
    case 'STAFF_REPLY': return 'chatbubbles-outline';
    default: return 'notifications-outline';
  }
}

/** Conduct warnings and officer reports stand out in red. The title still says what it is. */
export const isUrgentNotification = (type: NotificationType) => type === 'STAFF_WARNING' || type === 'OFFICER_COMPLAINT';
