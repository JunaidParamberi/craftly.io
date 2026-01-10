import type { Notification } from '../types';

class NotificationService {
  private permission: NotificationPermission = 'default';
  private notificationHistory: Notification[] = [];
  private maxHistorySize = 50;

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return;
    }

    try {
      // Use the browser's global Notification API (not our type)
      const browserNotification = new window.Notification(notification.title, {
        body: notification.description,
        icon: '/craftly_logo.svg',
        badge: '/craftly_logo.svg',
        tag: notification.id, // Prevents duplicate notifications
        requireInteraction: false,
        silent: false,
      });

      // Add click handler to focus the window
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  addToHistory(notification: Notification): void {
    // Remove duplicates
    this.notificationHistory = this.notificationHistory.filter(n => n.id !== notification.id);
    
    // Add to front
    this.notificationHistory.unshift(notification);
    
    // Limit history size
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(0, this.maxHistorySize);
    }

    // Persist to localStorage
    try {
      localStorage.setItem('craftly_notification_history', JSON.stringify(this.notificationHistory));
    } catch (error) {
      console.error('Error saving notification history:', error);
    }
  }

  getHistory(): Notification[] {
    // Load from localStorage if available
    if (this.notificationHistory.length === 0) {
      try {
        const stored = localStorage.getItem('craftly_notification_history');
        if (stored) {
          this.notificationHistory = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Error loading notification history:', error);
      }
    }
    return this.notificationHistory;
  }

  clearHistory(): void {
    this.notificationHistory = [];
    try {
      localStorage.removeItem('craftly_notification_history');
    } catch (error) {
      console.error('Error clearing notification history:', error);
    }
  }
}

export const notificationService = new NotificationService();