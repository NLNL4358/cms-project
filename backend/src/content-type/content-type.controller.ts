import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContentTypeService } from './content-type.service';
import { CreateContentTypeDto } from './dto/create-content-type.dto';
import { UpdateContentTypeDto } from './dto/update-content-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('content-types')
@UseGuards(JwtAuthGuard)
export class ContentTypeController {
  constructor(private readonly contentTypeService: ContentTypeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createContentTypeDto: CreateContentTypeDto) {
    return this.contentTypeService.create(createContentTypeDto);
  }

  @Get()
  findAll() {
    return this.contentTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentTypeService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContentTypeDto: UpdateContentTypeDto,
  ) {
    return this.contentTypeService.update(id, updateContentTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentTypeService.remove(id);
  }
}
