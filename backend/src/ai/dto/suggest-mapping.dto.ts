import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { Masters } from '../../types';

export class SuggestMappingDto {
  @IsString()
  @IsNotEmpty()
  ledgerName: string;

  @IsObject()
  @IsNotEmpty()
  masters: Masters;

  @IsNotEmpty()
  examples?: Array<{ name: string; majorHead: string; minorHead: string; grouping: string }>;
}
