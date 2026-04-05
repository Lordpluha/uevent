import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as webpush from 'web-push'
import { ApiConfigService } from '../../config/api-config.service'
import { PushSubscription } from './entities/push-subscription.entity'

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

  onModuleInit() {
    const { publicKey, privateKey, subject } = this.apiConfig.vapidConfig
    if (publicKey && privateKey && subject) {
      webpush.setVapidDetails(subject, publicKey, privateKey)
      this.enabled = true
      this.logger.log('Web Push initialized with VAPID keys')
    } else {
      this.logger.warn(
        'VAPID keys not configured — Web Push disabled. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT in .env',
      )
    }
  }

  get vapidPublicKey(): string | null {
    return this.apiConfig.vapidConfig.publicKey
  }

  async saveSubscription(userId: string, endpoint: string, p256dh: string, auth: string): Promise<PushSubscription> {
    const existing = await this.subscriptionsRepo.findOne({ where: { endpoint } })
    if (existing) {
      existing.user_id = userId
      existing.organization_id = null
      existing.p256dh = p256dh
      existing.auth = auth
      return this.subscriptionsRepo.save(existing)
    }
    const sub = this.subscriptionsRepo.create({ endpoint, p256dh, auth, user_id: userId, organization_id: null })
    return this.subscriptionsRepo.save(sub)
  }

  async saveSubscriptionForOrganization(
    orgId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
  ): Promise<PushSubscription> {
    const existing = await this.subscriptionsRepo.findOne({ where: { endpoint } })
    if (existing) {
      existing.organization_id = orgId
      existing.user_id = null
      existing.p256dh = p256dh
      existing.auth = auth
      return this.subscriptionsRepo.save(existing)
    }
    const sub = this.subscriptionsRepo.create({ endpoint, p256dh, auth, organization_id: orgId, user_id: null })
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
      } catch (err: unknown) {
        const pushErr = err as { message?: string; statusCode?: number }
        this.logger.warn(`Push failed for subscription ${sub.id}: ${pushErr.message}`)
        // 410 Gone / 404 Not Found = subscription expired — clean up
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          await this.subscriptionsRepo.remove(sub)
        }
      }
    }
  }

  async sendToOrganization(organizationId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) return

    const subscriptions = await this.subscriptionsRepo.find({ where: { organization_id: organizationId } })
    for (const sub of subscriptions) {
      if (!sub.p256dh || !sub.auth) continue
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
      } catch (err: unknown) {
        const pushErr = err as { message?: string; statusCode?: number }
        this.logger.warn(`Push failed for org subscription ${sub.id}: ${pushErr.message}`)
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          await this.subscriptionsRepo.remove(sub)
        }
      }
    }
  }
}
