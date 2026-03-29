import { BasicClientApi } from '@shared/api';
import type { ApiNotification } from '../model/notificationEntity';

class NotificationApi extends BasicClientApi {
  async getMine(limit = 20): Promise<ApiNotification[]> {
    return (await this.http.get<ApiNotification[]>(this.basePath, { params: { limit } })).data;
  }

  async markAsRead(id: string): Promise<ApiNotification> {
    return (await this.http.patch<ApiNotification>(`${this.basePath}/${id}/read`)).data;
  }
}

export const notificationsApi = new NotificationApi('/notifications');
