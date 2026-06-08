import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkTypeDto } from './dto/create-work-type.dto';
import { UpdateWorkTypeDto } from './dto/update-work-type.dto';

@Injectable()
export class WorkTypesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.workType.findMany({ orderBy: { name: 'asc' } });
  }

  findActive() {
    return this.prisma.workType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const row = await this.prisma.workType.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Вид работы не найден');
    return row;
  }

  private async hasDuplicateName(name: string, excludeId?: number): Promise<boolean> {
    const normalized = name.trim().toLowerCase();
    const all = await this.prisma.workType.findMany({
      where: excludeId ? { NOT: { id: excludeId } } : undefined,
    });
    return all.some((t) => t.name.trim().toLowerCase() === normalized);
  }

  async create(dto: CreateWorkTypeDto) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Название не может быть пустым');

    if (await this.hasDuplicateName(name)) {
      throw new ConflictException('Такой вид работы уже есть');
    }

    return this.prisma.workType.create({
      data: {
        name,
        isActive: true,
        isOther: name.toLowerCase() === 'другое',
      },
    });
  }

  async update(id: number, dto: UpdateWorkTypeDto) {
    await this.findOne(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('Название не может быть пустым');
      if (await this.hasDuplicateName(name, id)) {
        throw new ConflictException('Такой вид работы уже есть');
      }
    }

    return this.prisma.workType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined
          ? {
              name: dto.name.trim(),
              isOther: dto.name.trim().toLowerCase() === 'другое',
            }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.workType.delete({ where: { id } });
  }
}
