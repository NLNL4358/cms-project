import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleModule } from '../role/role.module';
import { SearchModule } from '../search/search.module';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [PrismaModule, RoleModule, SearchModule, WebhookModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
