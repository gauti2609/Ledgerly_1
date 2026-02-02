import { Controller, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';
import { SuggestMappingDto } from './dto/suggest-mapping.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatDto } from './dto/chat.dto';
import { GenerateTextDto } from './dto/generate-text.dto';
import { FinancialEntityService } from '../financial-entity/financial-entity.service';

import { AuditService } from '../audit/audit.service';
import { Request } from '@nestjs/common';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly auditService: AuditService,
    private readonly financialEntityService: FinancialEntityService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('suggest-mapping')
  async suggestMapping(@Request() req, @Body() suggestMappingDto: SuggestMappingDto) {
    try {
      // Fetch global examples from all entities
      const globalExamples = await this.financialEntityService.getGlobalMappedLedgers();

      // Combine with request examples if any (though frontend might stop sending them)
      const allExamples = [...(suggestMappingDto.examples || []), ...globalExamples];

      return await this.aiService.getMappingSuggestion(suggestMappingDto.ledgerName, suggestMappingDto.masters, undefined, allExamples);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('suggest-mapping-batch')
  async suggestMappingBatch(@Request() req, @Body() body: { ledgers: Array<{ name: string; balance: number }>, masters?: any, examples?: any[] }) {
    try {
      // Fetch global examples
      const globalExamples = await this.financialEntityService.getGlobalMappedLedgers();

      // Combine
      const allExamples = [...(body.examples || []), ...globalExamples];

      return await this.aiService.getBatchMappingSuggestions(body.ledgers, body.masters, allExamples);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(@Body() chatDto: ChatDto) {
    try {
      const response = await this.aiService.getChatResponse(chatDto.message, chatDto.history);

      return { text: response }; // Return object as frontend likely expects JSON or text
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-text')
  async generateText(@Body() generateTextDto: GenerateTextDto) {
    try {
      return await this.aiService.generateText(generateTextDto.prompt);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
