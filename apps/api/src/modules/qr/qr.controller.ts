import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { QrService } from './qr.service';

@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get(':sectionCode')
  @Header('Content-Type', 'image/png')
  async getQr(@Param('sectionCode') sectionCode: string, @Res() res: Response) {
    const buffer = await this.qrService.generatePng(sectionCode);
    res.send(buffer);
  }
}
