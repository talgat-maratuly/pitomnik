import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../entities/user.entity';

@Injectable()
export class AuthBootstrapService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    const count = await this.userRepo.count();
    if (count > 0) return;

    const username = process.env.ADMIN_USERNAME ?? 'admin';
    const password = process.env.ADMIN_PASSWORD ?? 'admin123';

    await this.userRepo.save(
      this.userRepo.create({
        fullName: 'Администратор',
        username,
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.ADMIN,
        isActive: true,
      }),
    );
    console.log(`[auth] Создан администратор: логин "${username}"`);
  }
}
