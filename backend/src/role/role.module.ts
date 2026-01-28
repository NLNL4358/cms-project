import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { UserRoleService } from './user-role.service';
import { UserRoleController } from './user-role.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RoleService, UserRoleService],
  controllers: [RoleController, UserRoleController],
  exports: [RoleService, UserRoleService],
})
export class RoleModule {}
