import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  ParseIntPipe,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/sigIn.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { SetPinDto } from './dto/set-pin.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger/dist/decorators/api-bearer.decorator';
import { ApiTags } from '@nestjs/swagger/dist/decorators/api-use-tags.decorator';

@ApiTags('Auth')
@ApiBearerAuth('JWT-auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  create(@Body(ValidationPipe) signUpDto: SignUpDto) {
    return this.authService.create(signUpDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  login(@Body(ValidationPipe) signInDto: SignInDto) {
    return this.authService.login(signInDto);
  }

  @Post('set-pin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  setWithdrawalPin(@Req() req: any, @Body() dto: SetPinDto) {
    if (dto.pin.length !== 4) {
      throw new BadRequestException('PIN must be 4 digits');
    }

    // req.user.id is now a string (UUID)
    return this.authService.setWithdrawalPin(req.user.id, dto.pin);
  }

  @Delete('logout/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    // Changed: Removed ParseIntPipe, changed type to string
    return this.authService.remove(id);
  }
}
