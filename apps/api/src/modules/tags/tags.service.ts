import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { CreateTagDto } from './dto/create-tag.dto'
import { UpdateTagDto } from './dto/update-tag.dto'
import { Tag } from './entities/tag.entity'
import { GetTagsParams } from './params'

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepo: Repository<Tag>,
  ) {}

  async create(dto: CreateTagDto) {
    const tag = this.tagsRepo.create(dto)
    return await this.tagsRepo.save(tag)
  }

  async findAll(query: GetTagsParams) {
    const { page, limit, search } = query

    const qb = this.tagsRepo.createQueryBuilder('tag')

    if (search) {
      qb.where('LOWER(tag.name) LIKE :search', { search: `%${search.toLowerCase()}%` })
    }

    qb.orderBy('tag.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)

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
    const tag = await this.tagsRepo.findOneBy({ id })

    if (!tag) throw new NotFoundException(`Tag #${id} not found`)
    return tag
  }

  async update(id: string, dto: UpdateTagDto) {
    const tag = await this.findOne(id)
    Object.assign(tag, dto)
    return await this.tagsRepo.save(tag)
  }

  async remove(id: string) {
    const tag = await this.findOne(id)
    await this.tagsRepo.remove(tag)
  }

  async findOrCreateByNames(names: string[]): Promise<Tag[]> {
    if (!names.length) return []
    const uniqueNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
    const existing = await this.tagsRepo.findBy({ name: In(uniqueNames) })
    const existingNamesSet = new Set(existing.map((t) => t.name))
    const toCreate = uniqueNames.filter((n) => !existingNamesSet.has(n)).map((n) => this.tagsRepo.create({ name: n }))
    const created = toCreate.length ? await this.tagsRepo.save(toCreate) : []
    return [...existing, ...created]
  }
}
