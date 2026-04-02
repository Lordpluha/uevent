import { BasicClientApi } from '@shared/api';
import type { ApiNotification } from '../model/notificationEntity';

class NotificationApi extends BasicClientApi {
  async getMine(limit = 20): Promise<ApiNotification[]> {
    return (await this.http.get<ApiNotification[]>(this.basePath, { params: { limit } })).data;
  }

  async markAsRead(id: string): Promise<ApiNotification> {
    return (await this.http.patch<ApiNotification>(`${this.basePath}/${id}/read`)).data;
  }

  async getPushVapidKey(): Promise<string | null> {
    const res = await this.http.get<{ publicKey: string | null }>(`${this.basePath}/push/vapid-key`);
    return res.data.publicKey;
  }

  async savePushSubscription(endpoint: string, p256dh: string, auth: string): Promise<void> {
    await this.http.post(`${this.basePath}/push/subscription`, { endpoint, p256dh, auth });
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await this.http.delete(`${this.basePath}/push/subscription`, { data: { endpoint } });
  }
}

export const notificationsApi = new NotificationApi('/notifications');

