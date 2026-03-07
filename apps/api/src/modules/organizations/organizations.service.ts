import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgsRepo: Repository<Organization>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const exists = await this.orgsRepo.findOneBy({ email: dto.email });

    if(exists) throw new ConflictException('Email already in use');

    const org = this.orgsRepo.create(dto);
    return await this.orgsRepo.save(org);
  }

  async findAll(): Promise<Organization[]> {
    return await this.orgsRepo.find({ relations: ['sessions'] });
  }

  async findOne(id: number): Promise<Organization> {
    const org = await this.orgsRepo.findOne({
      where: { id },
      relations: ['sessions', 'otps'],
    });
    
    if(!org) throw new NotFoundException(`Organization with id #${id} not found`);
    return org;
  }

  async update(id: number, dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.findOne(id);
    Object.assign(org, dto);
    return await this.orgsRepo.save(org);
  }

  async remove(id: number): Promise<void> {
    const org = await this.findOne(id);
    await this.orgsRepo.remove(org);
  }
}
