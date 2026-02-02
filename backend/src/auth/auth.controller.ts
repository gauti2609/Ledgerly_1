import { Controller, Post, Body, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    const result = await this.authService.login(loginDto.email, loginDto.password);
    console.log('Login Result:', result);
    return result;
  }

  /*
  @Post('register')
  async register(@Body() registerDto: { email: string; password: string }) {
    throw new ForbiddenException('Public registration is disabled. Please contact your administrator.');
    // return this.authService.register(registerDto.email, registerDto.password);
  }
  */
}
