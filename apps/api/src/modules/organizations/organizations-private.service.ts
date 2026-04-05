import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { hashPassword } from '../../common/password.util'
import { User } from '../users/entities/user.entity'
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto'
import { Organization } from './entities'

@Injectable()
export class OrganizationsPrivateService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgsRepo: Repository<Organization>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findOneEntity(id: string, relations: string[] = []) {
    const org = await this.orgsRepo.findOne({
      where: { id },
      relations,
    })

    if (!org) throw new NotFoundException(`Organization with id #${id} not found`)
    return org
  }

  async create(dto: CreateOrganizationDto) {
    const exists = await this.orgsRepo.findOneBy({ email: dto.email })

    if (exists) throw new ConflictException('Email already in use')

    const password = await hashPassword(dto.password)
    const org = this.orgsRepo.create({ ...dto, password })
    return await this.orgsRepo.save(org)
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const org = await this.findOneEntity(id)
    if (dto.password) dto.password = await hashPassword(dto.password)
    Object.assign(org, dto)
    return await this.orgsRepo.save(org)
  }

  async remove(id: string) {
    const org = await this.findOneEntity(id)
    await this.orgsRepo.remove(org)
  }

  async setAvatar(id: string, avatarUrl: string) {
    const org = await this.findOneEntity(id)
    org.avatar = avatarUrl
    return await this.orgsRepo.save(org)
  }

  async setCover(id: string, coverUrl: string) {
    const org = await this.findOneEntity(id)
    org.coverUrl = coverUrl
    return await this.orgsRepo.save(org)
  }

  async follow(id: string, userId: string) {
    const orgExists = await this.orgsRepo.existsBy({ id })
    if (!orgExists) throw new NotFoundException(`Organization with id #${id} not found`)

    const user = await this.usersRepo.findOneBy({ id: userId })
    if (!user) throw new NotFoundException(`User with id #${userId} not found`)

    // Use a raw insert with conflict ignore to avoid loading the full followers collection
    await this.orgsRepo
      .createQueryBuilder()
      .relation('followers')
      .of(id)
      .add(userId)
      .catch(() => undefined) // ignore duplicate key on re-follow

    return { followed: true }
  }

  async unfollow(id: string, userId: string) {
    const orgExists = await this.orgsRepo.existsBy({ id })
    if (!orgExists) throw new NotFoundException(`Organization with id #${id} not found`)

    await this.orgsRepo.createQueryBuilder().relation('followers').of(id).remove(userId)

    return { followed: false }
  }
}
