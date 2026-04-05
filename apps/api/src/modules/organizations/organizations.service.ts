import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsSelect, Repository } from 'typeorm'
import { ContentLocalizationService } from '../../common/localization/content-localization.service'
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto'
import { Organization } from './entities'
import { OrganizationSession } from './entities/organization-session.entity'
import { OrganizationsPrivateService } from './organizations-private.service'
import { GetOrganizationsParams } from './params'

const PUBLIC_ORG_SELECT: FindOptionsSelect<Organization> = {
  id: true,
  name: true,
  slogan: true,
  description: true,
  avatar: true,
  coverUrl: true,
  phone: true,
  email: true,
  category: true,
  verified: true,
  two_factor_enabled: true,
  tags: true,
  city: true,
  created_at: true,
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgsRepo: Repository<Organization>,

    @InjectRepository(OrganizationSession)
    private readonly sessionsRepo: Repository<OrganizationSession>,

    private readonly contentLocalization: ContentLocalizationService,
    private readonly organizationsPrivateService: OrganizationsPrivateService,
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

  private async enrichOrganizationsList(orgs: Organization[]) {
    if (orgs.length === 0) return []

    const orgIds = orgs.map((org) => org.id)

    const [followersCounts, eventsCounts] = await Promise.all([
      this.orgsRepo
        .createQueryBuilder('org')
        .leftJoin('org.followers', 'f')
        .where('org.id IN (:...orgIds)', { orgIds })
        .select('org.id', 'orgId')
        .addSelect('COUNT(f.id)', 'count')
        .groupBy('org.id')
        .getRawMany<{ orgId: string; count: string }>(),
      this.orgsRepo
        .createQueryBuilder('org')
        .leftJoin('org.events', 'e')
        .where('org.id IN (:...orgIds)', { orgIds })
        .select('org.id', 'orgId')
        .addSelect('COUNT(e.id)', 'count')
        .groupBy('org.id')
        .getRawMany<{ orgId: string; count: string }>(),
    ])

    const followersByOrgId = new Map(followersCounts.map((item) => [item.orgId, Number(item.count)]))
    const eventsByOrgId = new Map(eventsCounts.map((item) => [item.orgId, Number(item.count)]))

    return orgs.map((org) => ({
      ...org,
      followers: followersByOrgId.get(org.id) ?? 0,
      eventsCount: eventsByOrgId.get(org.id) ?? 0,
    }))
  }

  private async findOnePublicEntity(id: string) {
    const org = await this.orgsRepo.findOne({
      where: { id },
      select: PUBLIC_ORG_SELECT,
    })

    if (!org) throw new NotFoundException(`Organization with id #${id} not found`)
    return org
  }

  async create(dto: CreateOrganizationDto) {
    const org = await this.organizationsPrivateService.create(dto)
    return this.findOne(org.id)
  }

  async findAll(
    { page, limit, category, verified, search, tags, city }: GetOrganizationsParams,
    acceptLanguage?: string,
  ) {
    const qb = this.orgsRepo
      .createQueryBuilder('org')
      .select([
        'org.id',
        'org.name',
        'org.slogan',
        'org.description',
        'org.avatar',
        'org.coverUrl',
        'org.phone',
        'org.email',
        'org.category',
        'org.verified',
        'org.two_factor_enabled',
        'org.tags',
        'org.city',
        'org.created_at',
      ])
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

    const locale = this.contentLocalization.resolveRequestedLocale(acceptLanguage)
    const enriched = await this.enrichOrganizationsList(data)
    const dataWithStats = await Promise.all(
      enriched.map(async (org) => await this.contentLocalization.localizeOrganization(org, locale)),
    )

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

  async findOne(id: string, currentUserId?: string, acceptLanguage?: string) {
    const org = await this.findOnePublicEntity(id)
    const locale = this.contentLocalization.resolveRequestedLocale(acceptLanguage)
    return await this.contentLocalization.localizeOrganization(
      await this.enrichOrganization(org, currentUserId),
      locale,
      { includeEvents: true },
    )
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.organizationsPrivateService.update(id, dto)
    return this.findOne(id)
  }

  async remove(id: string) {
    await this.organizationsPrivateService.remove(id)
  }

  async setAvatar(id: string, avatarUrl: string) {
    await this.organizationsPrivateService.setAvatar(id, avatarUrl)
    return this.findOne(id)
  }

  async setCover(id: string, coverUrl: string) {
    await this.organizationsPrivateService.setCover(id, coverUrl)
    return this.findOne(id)
  }

  follow(id: string, userId: string) {
    return this.organizationsPrivateService.follow(id, userId)
  }

  unfollow(id: string, userId: string) {
    return this.organizationsPrivateService.unfollow(id, userId)
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

  async setBanned(id: string, banned: boolean): Promise<void> {
    const org = await this.orgsRepo.findOneBy({ id })
    if (!org) throw new NotFoundException(`Organization with id #${id} not found`)
    org.is_banned = banned
    await this.orgsRepo.save(org)
    if (banned) {
      await this.sessionsRepo.delete({ organization_id: id })
    }
  }
}
