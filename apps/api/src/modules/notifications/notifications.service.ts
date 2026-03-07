import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepo.create(dto);
    return await this.notificationsRepo.save(notification);
  }

  async findAll(): Promise<Notification[]> {
    return await this.notificationsRepo.find({ relations: ['user'] });
  }

  async findByUser(user_id: number): Promise<Notification[]> {
    return await this.notificationsRepo.find({ where: { user_id } });
  }

  async findOne(id: number): Promise<Notification> {
    const notification = await this.notificationsRepo.findOneBy({ id });
    
    if(!notification) throw new NotFoundException(`Notification with id #${id} not found`);
    return notification;
  }

  async update(id: number, dto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, dto);
    return await this.notificationsRepo.save(notification);
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.had_readed = true;
    return await this.notificationsRepo.save(notification);
  }

  async remove(id: number): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationsRepo.remove(notification);
  }
}
