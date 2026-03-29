import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Organization } from './entities'
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto'
import { GetOrganizationsParams } from './params'
import { hashPassword } from '../../common/password.util'
import { User } from '../users/entities/user.entity'

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgsRepo: Repository<Organization>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  private async enrichOrganization(org: Organization, currentUserId?: string) {
    const followersCount = await this.orgsRepo
      .createQueryBuilder('org')
      .leftJoin('org.followers', 'f')
      .where('org.id = :id', { id: org.id })
      .select('COUNT(f.id)', 'count')
      .getRawOne<{ count: string }>()

    const eventsCount = await this.orgsRepo
      .createQueryBuilder('org')
      .leftJoin('org.events', 'e')
      .where('org.id = :id', { id: org.id })
      .select('COUNT(e.id)', 'count')
      .getRawOne<{ count: string }>()

    const isFollowing = currentUserId
      ? (await this.orgsRepo
          .createQueryBuilder('org')
          .leftJoin('org.followers', 'f')
          .where('org.id = :orgId', { orgId: org.id })
          .andWhere('f.id = :userId', { userId: currentUserId })
          .getCount()) > 0
      : false

    return {
      ...org,
      followers: Number(followersCount?.count ?? 0),
      eventsCount: Number(eventsCount?.count ?? 0),
      is_following: isFollowing,
    }
  }

  private async findOneEntity(id: string) {
    const org = await this.orgsRepo.findOne({
      where: { id },
      relations: ['sessions', 'otps', 'followers', 'events'],
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

  async findAll({ page, limit, category, verified, search, tags, city }: GetOrganizationsParams) {
    const qb = this.orgsRepo.createQueryBuilder('org')
      .leftJoinAndSelect('org.sessions', 'session')
      .skip((page - 1) * limit)
      .take(limit)

    if (category) {
      qb.andWhere('org.category = :category', { category })
    }
    if (typeof verified === 'boolean') {
      qb.andWhere('org.verified = :verified', { verified })
    }
    if (search) {
      qb.andWhere('(org.name ILIKE :search OR org.description ILIKE :search)', { search: `%${search}%` })
    }
    if (city) {
      qb.andWhere('org.city ILIKE :city', { city: `%${city}%` })
    }
    if (tags && tags.length) {
      qb.andWhere('org.tags && ARRAY[:...tags]', { tags })
    }

    const [data, total] = await qb.getManyAndCount()

    const dataWithStats = await Promise.all(data.map((org) => this.enrichOrganization(org)))

    return {
      data: dataWithStats,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    }
  }

  async findOne(id: string, currentUserId?: string) {
    const org = await this.findOneEntity(id)
    return this.enrichOrganization(org, currentUserId)
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
    const org = await this.orgsRepo.findOne({ where: { id }, relations: ['followers'] })
    if (!org) throw new NotFoundException(`Organization with id #${id} not found`)

    const user = await this.usersRepo.findOneBy({ id: userId })
    if (!user) throw new NotFoundException(`User with id #${userId} not found`)

    if (!org.followers?.some((f) => f.id === userId)) {
      org.followers = [...(org.followers ?? []), user]
      await this.orgsRepo.save(org)
    }

    return { followed: true }
  }

  async unfollow(id: string, userId: string) {
    const org = await this.orgsRepo.findOne({ where: { id }, relations: ['followers'] })
    if (!org) throw new NotFoundException(`Organization with id #${id} not found`)

    org.followers = (org.followers ?? []).filter((f) => f.id !== userId)
    await this.orgsRepo.save(org)

    return { followed: false }
  }

  async isFollowing(id: string, userId: string) {
    const count = await this.orgsRepo
      .createQueryBuilder('org')
      .leftJoin('org.followers', 'f')
      .where('org.id = :orgId', { orgId: id })
      .andWhere('f.id = :userId', { userId })
      .getCount()

    return { followed: count > 0 }
  }
}
