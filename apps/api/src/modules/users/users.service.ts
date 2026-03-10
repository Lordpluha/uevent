import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { Repository } from 'typeorm'
import { GetUsersParams } from './params'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const user = this.userRepository.create(dto)
    return await this.userRepository.save(user)
  }

  async findAll(query: GetUsersParams) {
    const { page, limit } = query

    const [data, total] = await this.userRepository.findAndCount({
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

  async findOne(id: number) {
    const user = await this.userRepository.findOneBy({ id })

    if (!user) throw new NotFoundException(`User with id #${id} not found`)
    return user
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findOne(id)
    Object.assign(user, dto)
    return await this.userRepository.save(user)
  }

  async remove(id: number) {
    const user = await this.findOne(id)
    await this.userRepository.remove(user)
  }
}
