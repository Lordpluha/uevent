import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { hashPassword } from '../../common/password.util'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { User } from './entities/user.entity'

@Injectable()
export class UsersPrivateService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const password = await hashPassword(dto.password)
    const user = this.usersRepo.create({ ...dto, password })
    return await this.usersRepo.save(user)
  }

  async findOneEntity(id: string) {
    const user = await this.usersRepo.findOneBy({ id })
    if (!user) throw new NotFoundException(`User with id #${id} not found`)
    return user
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOneEntity(id)
    if (dto.password) dto.password = await hashPassword(dto.password)
    Object.assign(user, dto)
    return await this.usersRepo.save(user)
  }

  async remove(id: string) {
    const user = await this.findOneEntity(id)
    await this.usersRepo.remove(user)
  }

  async setAvatar(id: string, avatarUrl: string) {
    const user = await this.findOneEntity(id)
    user.avatar = avatarUrl
    return await this.usersRepo.save(user)
  }
}
