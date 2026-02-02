import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MessagePart {
  @IsNotEmpty()
  text: string;
}

class Message {
  @IsNotEmpty()
  role: 'user' | 'model';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessagePart)
  parts: MessagePart[];
}

export class ChatDto {
  @IsNotEmpty()
  message: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Message)
  history: Message[];
}
