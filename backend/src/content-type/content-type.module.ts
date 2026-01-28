import { Module } from '@nestjs/common';
import { ContentTypeService } from './content-type.service';
import { ContentTypeController } from './content-type.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [PrismaModule, RoleModule],
  controllers: [ContentTypeController],
  providers: [ContentTypeService],
  exports: [ContentTypeService],
})
export class ContentTypeModule {}
