import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { LoginDto } from './dto/login.dto';

export type JwtPayload = { sub: number; role: string };

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { username: username.trim() } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException('Для этого пользователя вход не настроен');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Неверный логин или пароль');
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.username, dto.password);
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: this.toPublicUser(user),
    };
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id, isActive: true } });
  }

  toPublicUser(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      brigadeId: user.brigadeId,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
