import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { MemberAuthController } from './member/member-auth.controller';
import { MemberContentController } from './member/member-content.controller';
import { MemberMediaController } from './member/member-media.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeyModule } from '../api-key/api-key.module';
import { AuthModule } from '../auth/auth.module';
import { SearchModule } from '../search/search.module';
import { WebhookModule } from '../webhook/webhook.module';
import { MediaModule } from '../media/media.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, ApiKeyModule, AuthModule, SearchModule, WebhookModule, MediaModule, EmailModule],
  controllers: [
    PublicApiController,
    MemberAuthController,
    MemberContentController,
    MemberMediaController,
  ],
  providers: [PublicApiService],
})
export class PublicApiModule {}
