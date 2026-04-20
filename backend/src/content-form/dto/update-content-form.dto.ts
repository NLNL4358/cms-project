import { PartialType } from '@nestjs/swagger';
import { CreateContentFormDto } from './create-content-form.dto';

export class UpdateContentFormDto extends PartialType(CreateContentFormDto) {}
