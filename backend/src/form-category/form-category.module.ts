import { Module } from '@nestjs/common';
import { FormCategoryController } from './form-category.controller';
import { FormCategoryService } from './form-category.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [PrismaModule, RoleModule],
  controllers: [FormCategoryController],
  providers: [FormCategoryService],
  exports: [FormCategoryService],
})
export class FormCategoryModule {}
