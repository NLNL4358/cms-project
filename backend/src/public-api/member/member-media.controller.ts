/**
 * @description
 * 일반 회원(MEMBER)이 파일을 업로드하는 API
 * 프로필 사진, 게시글 첨부 이미지 등에 사용
 */
import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { MediaService } from '../../media/media.service';

@Controller('public/member/media')
@UseGuards(JwtAuthGuard)
export class MemberMediaController {
  constructor(private mediaService: MediaService) {}

  /** 회원 파일 업로드 (multipart/form-data, 최대 10MB) */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('파일 크기는 10MB 이하여야 합니다');
    }

    // 회원 업로드는 별도 폴더 없이 루트에 저장
    const media = await this.mediaService.create(
      file,
      userId,
      undefined, // folderId
      '', // alt
      '', // caption
    );

    return {
      id: media.id,
      url: media.url,
      filename: media.filename,
      size: media.size,
      mimeType: media.mimeType,
    };
  }
}
