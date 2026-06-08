import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { WorkLogQueryDto } from '../work-logs/dto/work-log-query.dto';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('work-logs.xlsx')
  async exportWorkLogs(@Query() query: WorkLogQueryDto, @Res() res: Response) {
    const buffer = await this.exportService.buildWorkLogsXlsx(query);
    const from = query.dateFrom ?? 'all';
    const to = query.dateTo ?? 'all';
    const filename = `otchet_rabot_pitomnik_${from}_${to}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  }
}
