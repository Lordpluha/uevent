import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { FindOptionsSelect, Repository } from 'typeorm'
import { GetUsersParams } from './params'
import { UsersPrivateService } from './users-private.service'

const PUBLIC_USER_SELECT: FindOptionsSelect<User> = {
  id: true,
  username: true,
  first_name: true,
  last_name: true,
  location: true,
  avatar: true,
  bio: true,
  website: true,
  timezone: true,
  interests: true,
  created_at: true,
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    private readonly usersPrivateService: UsersPrivateService,
  ) {}

  async create(dto: CreateUserDto) {
    const user = await this.usersPrivateService.create(dto)
    return this.findOne(user.id)
  }

  async findAll(query: GetUsersParams) {
    const { page, limit } = query

    const [data, total] = await this.usersRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      select: PUBLIC_USER_SELECT,
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

  async count() {
    return { count: await this.usersRepo.count() }
  }

  private async findOnePublicEntity(id: string) {
    const user = await this.usersRepo.findOne({
      where: { id },
      select: PUBLIC_USER_SELECT,
    })

    if (!user) throw new NotFoundException(`User with id #${id} not found`)
    return user
  }

  async findOne(id: string) {
    return await this.findOnePublicEntity(id)
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.usersPrivateService.update(id, dto)
    return this.findOne(id)
  }

  async remove(id: string) {
    await this.usersPrivateService.remove(id)
  }

  async setAvatar(id: string, avatarUrl: string) {
    await this.usersPrivateService.setAvatar(id, avatarUrl)
    return this.findOne(id)
  }
}
