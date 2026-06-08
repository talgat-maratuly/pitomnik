import { Injectable, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { buildFormUrl } from '../../common/app-url';

@Injectable()
export class QrService {
  constructor(private readonly prisma: PrismaService) {}

  async getFormUrlBySectionCode(sectionCode: string): Promise<string> {
    const section = await this.prisma.section.findUnique({ where: { code: sectionCode } });
    if (!section) throw new NotFoundException('Участок не найден');
    return section.formUrl ?? buildFormUrl(sectionCode);
  }

  async generatePng(sectionCode: string): Promise<Buffer> {
    const url = await this.getFormUrlBySectionCode(sectionCode);
    return QRCode.toBuffer(url, { type: 'png', width: 400, margin: 2 });
  }
}
