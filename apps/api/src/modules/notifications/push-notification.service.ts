import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as webpush from 'web-push'
import { PushSubscription } from './entities/push-subscription.entity'
import { ApiConfigService } from '../../config/api-config.service'

export interface PushPayload {
  title: string
  body: string
  url?: string
}

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private enabled = false
  private readonly logger = new Logger(PushNotificationService.name)

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subscriptionsRepo: Repository<PushSubscription>,
    private readonly apiConfig: ApiConfigService,
  ) {}

  async onModuleInit() {
    const { publicKey, privateKey, subject } = this.apiConfig.vapidConfig
    if (publicKey && privateKey && subject) {
      webpush.setVapidDetails(subject, publicKey, privateKey)
      this.enabled = true
      this.logger.log('Web Push initialized with VAPID keys')
    } else {
      this.logger.warn('VAPID keys not configured — Web Push disabled. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT in .env')
    }
  }

  get vapidPublicKey(): string | null {
    return this.apiConfig.vapidConfig.publicKey
  }

  async saveSubscription(userId: string, endpoint: string, p256dh: string, auth: string): Promise<PushSubscription> {
    const existing = await this.subscriptionsRepo.findOne({ where: { endpoint } })
    if (existing) {
      existing.user_id = userId
      existing.p256dh = p256dh
      existing.auth = auth
      return this.subscriptionsRepo.save(existing)
    }
    const sub = this.subscriptionsRepo.create({ endpoint, p256dh, auth, user_id: userId })
    return this.subscriptionsRepo.save(sub)
  }

  async deleteSubscription(userId: string, endpoint: string): Promise<void> {
    await this.subscriptionsRepo.delete({ user_id: userId, endpoint })
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) return

    const subscriptions = await this.subscriptionsRepo.find({ where: { user_id: userId } })
    for (const sub of subscriptions) {
      if (!sub.p256dh || !sub.auth) continue
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
      } catch (err: any) {
        this.logger.warn(`Push failed for subscription ${sub.id}: ${err.message}`)
        // 410 Gone / 404 Not Found = subscription expired — clean up
        if (err.statusCode === 410 || err.statusCode === 404) {
          await this.subscriptionsRepo.remove(sub)
        }
      }
    }
  }
}
