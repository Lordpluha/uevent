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
      relations: ['user'],
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
    return await this.notificationsRepo.find({ where: { user_id } })
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

  async remove(id: string) {
    const notification = await this.findOne(id)
    await this.notificationsRepo.remove(notification)
  }
}
