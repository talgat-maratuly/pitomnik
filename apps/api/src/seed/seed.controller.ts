import { Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeedResultDto } from './dto/seed-result.dto';
import { SeedService } from './seed.service';

@ApiTags('seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('run')
  @ApiOperation({
    summary: 'Запустить seed',
    description:
      'Создаёт стандартные виды работ и счётчик кодов участков, если их ещё нет. Безопасно вызывать повторно.',
  })
  @ApiOkResponse({ type: SeedResultDto })
  run(): Promise<SeedResultDto> {
    return this.seedService.run();
  }
}
