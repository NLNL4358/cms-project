import { Module } from '@nestjs/common';
import { ApiKeyController } from './api-key.controller';
import { ApiKeyService } from './api-key.service';
import { ApiKeyGuard } from './api-key.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [PrismaModule, RoleModule],
  controllers: [ApiKeyController],
  providers: [ApiKeyService, ApiKeyGuard],
  exports: [ApiKeyService, ApiKeyGuard],
})
export class ApiKeyModule {}
