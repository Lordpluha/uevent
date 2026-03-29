import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification } from './entities'
import { CreateNotificationDto, UpdateNotificationDto } from './dto'
import { GetNotificationsParamsDto } from './params'

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

  async findAll(query: GetNotificationsParamsDto) {
    const { page, limit } = query

    const [data, total] = await this.notificationsRepo.findAndCount({
      relations: ['user', 'organization'],
      skip: (page - 1) * limit,
      take: limit,
    })

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    }
  }

  async findByUser(user_id: string) {
    return await this.notificationsRepo.find({
      where: { user_id },
      order: { created: 'DESC' },
    })
  }

  async findByOrganization(organization_id: string) {
    return await this.notificationsRepo.find({
      where: { organization_id },
      order: { created: 'DESC' },
    })
  }

  async findLatestByUser(user_id: string, limit: number) {
    return await this.notificationsRepo.find({
      where: { user_id },
      order: { created: 'DESC' },
      take: limit,
    })
  }

  async findLatestByOrganization(organization_id: string, limit: number) {
    return await this.notificationsRepo.find({
      where: { organization_id },
      order: { created: 'DESC' },
      take: limit,
    })
  }

  async findOne(id: string) {
    const notification = await this.notificationsRepo.findOneBy({ id })

    if (!notification) throw new NotFoundException(`Notification with id #${id} not found`)
    return notification
  }

  async update(id: string, dto: UpdateNotificationDto) {
    const notification = await this.findOne(id)
    Object.assign(notification, dto)
    return await this.notificationsRepo.save(notification)
  }

  async markAsRead(id: string) {
    const notification = await this.findOne(id)
    notification.had_readed = true
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

  async remove(id: string) {
    const notification = await this.findOne(id)
    await this.notificationsRepo.remove(notification)
  }
}
