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

  async findAll({ page, limit }: GetOrganizationsParams) {

    const [data, total] = await this.orgsRepo.findAndCount({
      relations: ['sessions'],
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
