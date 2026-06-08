import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';

@Injectable()
export class ObjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.object.findMany({
      orderBy: { name: 'asc' },
      include: { sections: { orderBy: { code: 'asc' } } },
    });
  }

  async findOne(id: number) {
    const row = await this.prisma.object.findUnique({
      where: { id },
      include: { sections: { orderBy: { code: 'asc' } } },
    });
    if (!row) throw new NotFoundException('Объект не найден');
    return row;
  }

  create(dto: CreateObjectDto) {
    return this.prisma.object.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
      },
    });
  }

  async update(id: number, dto: UpdateObjectDto) {
    await this.findOne(id);
    return this.prisma.object.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.object.delete({ where: { id } });
  }
}
