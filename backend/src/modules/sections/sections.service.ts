import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { nextSectionCode } from '../../common/section-code';
import { buildFormUrl, buildQrApiUrl } from '../../common/app-url';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

const sectionInclude = {
  object: true,
} as const;

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.section.findMany({
      orderBy: { code: 'asc' },
      include: sectionInclude,
    });
  }

  async findOne(id: number) {
    const row = await this.prisma.section.findUnique({
      where: { id },
      include: sectionInclude,
    });
    if (!row) throw new NotFoundException('Участок не найден');
    return row;
  }

  async findByCode(code: string) {
    const row = await this.prisma.section.findUnique({
      where: { code },
      include: sectionInclude,
    });
    if (!row) throw new NotFoundException('Участок не найден');
    return row;
  }

  async create(dto: CreateSectionDto) {
    const object = await this.prisma.object.findUnique({ where: { id: dto.objectId } });
    if (!object) throw new NotFoundException('Объект не найден');

    const code = await nextSectionCode(this.prisma);
    const formUrl = buildFormUrl(code);
    const qrCodeUrl = buildQrApiUrl(code);

    return this.prisma.section.create({
      data: {
        objectId: dto.objectId,
        code,
        name: dto.name.trim(),
        area: dto.area?.trim() || null,
        culture: dto.culture?.trim() || null,
        customText: dto.customText?.trim() || null,
        formUrl,
        qrCodeUrl,
      },
      include: sectionInclude,
    });
  }

  async update(id: number, dto: UpdateSectionDto) {
    await this.findOne(id);
    if (dto.objectId !== undefined) {
      const object = await this.prisma.object.findUnique({ where: { id: dto.objectId } });
      if (!object) throw new NotFoundException('Объект не найден');
    }

    return this.prisma.section.update({
      where: { id },
      data: {
        ...(dto.objectId !== undefined ? { objectId: dto.objectId } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.area !== undefined ? { area: dto.area?.trim() || null } : {}),
        ...(dto.culture !== undefined ? { culture: dto.culture?.trim() || null } : {}),
        ...(dto.customText !== undefined ? { customText: dto.customText?.trim() || null } : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.radiusMeters !== undefined ? { radiusMeters: dto.radiusMeters } : {}),
      },
      include: sectionInclude,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.section.delete({ where: { id } });
  }
}
