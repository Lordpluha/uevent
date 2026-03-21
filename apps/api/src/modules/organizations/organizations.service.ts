import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Organization } from './entities'
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto'
import { GetOrganizationsParams } from './params'
import { hashPassword } from '../../common/password.util'

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgsRepo: Repository<Organization>,
  ) {}

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

  async findOne(id: string) {
    const org = await this.orgsRepo.findOne({
      where: { id },
      relations: ['sessions', 'otps'],
    })

    if (!org) throw new NotFoundException(`Organization with id #${id} not found`)
    return org
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const org = await this.findOne(id)
    if (dto.password) dto.password = await hashPassword(dto.password)
    Object.assign(org, dto)
    return await this.orgsRepo.save(org)
  }

  async remove(id: string) {
    const org = await this.findOne(id)
    await this.orgsRepo.remove(org)
  }
}
