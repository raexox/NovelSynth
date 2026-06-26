export type NotificationTone = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  tone: NotificationTone;
  title: string;
  message?: string;
}

export const notify = (notification: Omit<AppNotification, 'id'>) => {
  window.dispatchEvent(new CustomEvent('novelsynth:notify', {
    detail: {
      id: crypto.randomUUID(),
      ...notification
    } satisfies AppNotification
  }));
};
