import { Module } from '@nestjs/common';
import { ContentFormService } from './content-form.service';
import { ContentFormController } from './content-form.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [PrismaModule, RoleModule],
  controllers: [ContentFormController],
  providers: [ContentFormService],
  exports: [ContentFormService],
})
export class ContentFormModule {}
