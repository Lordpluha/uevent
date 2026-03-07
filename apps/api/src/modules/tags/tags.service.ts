import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepo: Repository<Tag>,
  ) {}

  async create(dto: CreateTagDto): Promise<Tag> {
    const tag = this.tagsRepo.create(dto);
    return await this.tagsRepo.save(tag);
  }

  async findAll(): Promise<Tag[]> {
    return await this.tagsRepo.find();
  }

  async findOne(id: number): Promise<Tag> {
    const tag = await this.tagsRepo.findOneBy({ id });
    
    if(!tag) throw new NotFoundException(`Tag #${id} not found`);
    return tag;
  }

  async update(id: number, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);
    Object.assign(tag, dto);
    return await this.tagsRepo.save(tag);
  }

  async remove(id: number): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagsRepo.remove(tag);
  }
}
