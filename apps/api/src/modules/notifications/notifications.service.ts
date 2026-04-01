import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification } from './entities'
import { CreateNotificationDto, UpdateNotificationDto } from './dto'

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = this.notificationsRepo.create(dto)
    return await this.notificationsRepo.save(notification)
  }

  async findByUser(user_id: string) {
    return await this.notificationsRepo.find({
      where: { user_id },
      order: { created: 'DESC' },
    })
  }

  async findLatestByUser(user_id: string, limit: number, page: number = 1) {
    return await this.notificationsRepo.find({
      where: { user_id },
      order: { created: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    })
  }

  async findLatestByOrganization(organization_id: string, limit: number, page: number = 1) {
    return await this.notificationsRepo.find({
      where: { organization_id },
      order: { created: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    })
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
    if (notification.had_readed) return notification
    notification.had_readed = true
    return await this.notificationsRepo.save(notification)
  }

  async markAsReadForOrganization(id: string, organization_id: string) {
    const notification = await this.notificationsRepo.findOneBy({ id, organization_id })
    if (!notification) throw new NotFoundException(`Notification with id #${id} not found`)
    if (notification.had_readed) return notification
    notification.had_readed = true
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
