import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Tag } from './entities/tag.entity'
import { CreateTagDto } from './dto/create-tag.dto'
import { UpdateTagDto } from './dto/update-tag.dto'
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
    const { page, limit } = query

    const [data, total] = await this.tagsRepo.findAndCount({
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
}
