import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiPlantStatus } from '../../common/enums/ai-plant-status.enum';
import { AiAgronomAnalysis } from '../../entities/ai-agronom-analysis.entity';
import { NurseryObject } from '../../entities/nursery-object.entity';
import { Section } from '../../entities/section.entity';
import { User } from '../../entities/user.entity';
import { CreateAiAnalysisDto } from './dto/create-ai-analysis.dto';

type GeneratedAnalysis = {
  status: AiPlantStatus;
  confidence: number;
  aiComment: string;
  recommendations: string[];
};

function parseRecommendations(raw: string): string[] {
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

@Injectable()
export class AiAgronomService {
  constructor(
    @InjectRepository(AiAgronomAnalysis)
    private readonly analysisRepo: Repository<AiAgronomAnalysis>,
    @InjectRepository(NurseryObject)
    private readonly objectRepo: Repository<NurseryObject>,
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
  ) {}

  private mapAnalysis(row: AiAgronomAnalysis) {
    return {
      id: row.id,
      createdById: row.createdById,
      objectId: row.objectId,
      sectionId: row.sectionId,
      culture: row.culture,
      photoUrl: row.photoUrl,
      status: row.status,
      confidence: row.confidence,
      aiComment: row.aiComment,
      recommendations: parseRecommendations(row.recommendations),
      agronomistComment: row.agronomistComment,
      createdAt: row.createdAt,
      createdBy: row.createdBy
        ? { id: row.createdBy.id, fullName: row.createdBy.fullName }
        : null,
      object: row.object ? { id: row.object.id, name: row.object.name } : null,
      section: row.section
        ? {
            id: row.section.id,
            name: row.section.name,
            code: row.section.code,
            culture: row.section.culture,
          }
        : null,
    };
  }

  private generateAnalysis(dto: CreateAiAnalysisDto): GeneratedAnalysis {
    const text = `${dto.culture ?? ''} ${dto.agronomistComment ?? ''}`.toLowerCase();
    const problemWords = ['болез', 'вредител', 'гниль', 'плесень', 'сильно', 'пятн', 'сохнет'];
    const attentionWords = ['желт', 'сух', 'полив', 'вода', 'стресс', 'удобр', 'обрез'];

    const hasProblem = problemWords.some((word) => text.includes(word));
    const hasAttention = attentionWords.some((word) => text.includes(word));

    if (hasProblem) {
      return {
        status: AiPlantStatus.PROBLEM,
        confidence: 88,
        aiComment:
          'На фото и в комментарии отмечены признаки возможной проблемы: заболевание, вредители, пятна или выраженный стресс растения. Рекомендуется очный осмотр агрономом.',
        recommendations: [
          'Изолировать проблемные растения при возможности',
          'Проверить листья с обеих сторон на вредителей',
          'Провести обработку по регламенту после очного осмотра',
          'Проверить влажность почвы и состояние корневой зоны',
          'Осмотреть растение повторно через 2-3 дня',
        ],
      };
    }

    if (hasAttention) {
      return {
        status: AiPlantStatus.ATTENTION,
        confidence: 91,
        aiComment:
          'Есть признаки, которые требуют внимания: возможное пожелтение, сухость, стресс, нарушение полива или потребность в подкормке.',
        recommendations: [
          'Проверить влажность почвы',
          'Скорректировать режим полива',
          'Оценить необходимость подкормки',
          'Удалить сухие или повреждённые листья',
          'Осмотреть растение повторно через 3 дня',
        ],
      };
    }

    return {
      status: AiPlantStatus.GOOD,
      confidence: 95,
      aiComment:
        'Растение выглядит удовлетворительно. Явных признаков заболевания, вредителей или сильного стресса не обнаружено.',
      recommendations: [
        'Продолжать текущий уход',
        'Поддерживать регулярный полив',
        'Периодически проверять влажность почвы',
        'Проводить профилактический осмотр листьев',
      ],
    };
  }

  async create(dto: CreateAiAnalysisDto, user: User) {
    const object = await this.objectRepo.findOne({ where: { id: dto.objectId } });
    if (!object) throw new NotFoundException('Объект не найден');

    if (dto.sectionId) {
      const section = await this.sectionRepo.findOne({ where: { id: dto.sectionId } });
      if (!section) throw new NotFoundException('Участок не найден');
      if (section.objectId !== dto.objectId) {
        throw new BadRequestException('Участок не относится к выбранному объекту');
      }
    }

    const generated = this.generateAnalysis(dto);
    const row = await this.analysisRepo.save(
      this.analysisRepo.create({
        createdById: user.id,
        objectId: dto.objectId,
        sectionId: dto.sectionId ?? null,
        culture: dto.culture?.trim() || null,
        photoUrl: dto.photoUrl,
        status: generated.status,
        confidence: generated.confidence,
        aiComment: generated.aiComment,
        recommendations: JSON.stringify(generated.recommendations),
        agronomistComment: dto.agronomistComment?.trim() || null,
      }),
    );
    return this.findOne(row.id);
  }

  async findOne(id: number) {
    const row = await this.analysisRepo.findOne({
      where: { id },
      relations: { createdBy: true, object: true, section: true },
    });
    if (!row) throw new NotFoundException('AI-анализ не найден');
    return this.mapAnalysis(row);
  }

  async findAll() {
    const rows = await this.analysisRepo.find({
      relations: { createdBy: true, object: true, section: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return rows.map((row) => this.mapAnalysis(row));
  }

  async getStats() {
    const rows = await this.analysisRepo.find({
      relations: { object: true },
      order: { createdAt: 'DESC' },
    });
    const byStatus = {
      healthy: rows.filter((row) => row.status === AiPlantStatus.GOOD).length,
      attention: rows.filter((row) => row.status === AiPlantStatus.ATTENTION).length,
      problem: rows.filter((row) => row.status === AiPlantStatus.PROBLEM).length,
    };

    const problemObjects = new Map<string, number>();
    for (const row of rows) {
      if (row.status === AiPlantStatus.GOOD) continue;
      const name = row.object?.name ?? '—';
      problemObjects.set(name, (problemObjects.get(name) ?? 0) + 1);
    }

    return {
      total: rows.length,
      ...byStatus,
      problemObjects: [...problemObjects.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([objectName, count]) => ({ objectName, count })),
    };
  }
}
