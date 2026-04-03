import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification } from './entities'
import { CreateNotificationDto, UpdateNotificationDto } from './dto'
import { User } from '../users/entities/user.entity'
import { PushNotificationService } from './push-notification.service'

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    private readonly pushService: PushNotificationService,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = this.notificationsRepo.create(dto)
    const saved = await this.notificationsRepo.save(notification)

    // Fire a browser push if the target user has it enabled
    if (saved.user_id) {
      const user = await this.usersRepo.findOne({
        where: { id: saved.user_id },
        select: ['id', 'push_notifications_enabled'],
      })
      if (user?.push_notifications_enabled) {
        this.pushService.sendToUser(saved.user_id, {
          title: saved.name,
          body: saved.content,
          url: saved.link ?? '/',
        }).catch(() => undefined)
      }
    }

    return saved
  }

  async findByUser(user_id: string) {
    return await this.notificationsRepo.find({
      where: { user_id },
      order: { created_at: 'DESC' },
    })
  }

  async findLatestByUser(user_id: string, limit: number, page: number = 1) {
    const [data, total] = await this.notificationsRepo.findAndCount({
      where: { user_id },
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    })
    return { data, meta: { total, page, limit, total_pages: Math.ceil(total / limit) } }
  }

  async findLatestByOrganization(organization_id: string, limit: number, page: number = 1) {
    const [data, total] = await this.notificationsRepo.findAndCount({
      where: { organization_id },
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    })
    return { data, meta: { total, page, limit, total_pages: Math.ceil(total / limit) } }
  }

  async findOneForUser(id: string, user_id: string) {
    const notification = await this.notificationsRepo.findOneBy({ id, user_id })
    if (!notification) throw new NotFoundException(`Notification with id #${id} not found`)
    return notification
  }

  async findOneForOrganization(id: string, organization_id: string) {
    const notification = await this.notificationsRepo.findOneBy({ id, organization_id })
    if (!notification) throw new NotFoundException(`Notification with id #${id} not found`)
    return notification
  }

  async updateForUser(id: string, user_id: string, dto: UpdateNotificationDto) {
    const notification = await this.findOneForUser(id, user_id)
    Object.assign(notification, dto)
    return await this.notificationsRepo.save(notification)
  }

  async updateForOrganization(id: string, organization_id: string, dto: UpdateNotificationDto) {
    const notification = await this.findOneForOrganization(id, organization_id)
    Object.assign(notification, dto)
    return await this.notificationsRepo.save(notification)
  }

  async markAsReadForUser(id: string, user_id: string) {
    const notification = await this.notificationsRepo.findOneBy({ id, user_id })
    if (!notification) throw new NotFoundException(`Notification with id #${id} not found`)
    if (notification.is_read) return notification
    notification.is_read = true
    return await this.notificationsRepo.save(notification)
  }

  async markAsReadForOrganization(id: string, organization_id: string) {
    const notification = await this.notificationsRepo.findOneBy({ id, organization_id })
    if (!notification) throw new NotFoundException(`Notification with id #${id} not found`)
    if (notification.is_read) return notification
    notification.is_read = true
    return await this.notificationsRepo.save(notification)
  }

  async removeForUser(id: string, user_id: string) {
    const notification = await this.findOneForUser(id, user_id)
    await this.notificationsRepo.remove(notification)
  }

  async removeForOrganization(id: string, organization_id: string) {
    const notification = await this.findOneForOrganization(id, organization_id)
    await this.notificationsRepo.remove(notification)
  }
}
