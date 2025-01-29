/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Res, Req, UseGuards, Get } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './common/dtos/register.dto';
import { LoginDto } from './common/dtos/login.dto';
import { JwtGuard } from './common/guards/jwt.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto, @Res() res: Response): Promise<Response<MessageResponse>> {
        const response = await this.authService.login(loginDto);

        const { accessToken, refreshToken } = response;

        console.log('hit auth controller- access token :', accessToken);
        console.log('hit auth controller- refresh_token :', refreshToken);

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3 * 60 * 1000,
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.send({ message: 'Login successful' });
    }

    @UseGuards(JwtGuard)
    @Post('logout')
    async logout(@Req() req: Request, @Res() res: Response): Promise<Response<MessageResponse>> {
        const refreshToken = req.cookies['refresh_token'];
        // const decodedRefreshToken = await this.authService.validateRefreshToken(refreshToken);

        // const logoutData = { email: decodedRefreshToken.email, userId: decodedRefreshToken.sub };
        await this.authService.logout(refreshToken);
        res.cookie('access_token', '', { expires: new Date(0) });
        res.cookie('refresh_token', '', { expires: new Date(0) });
        return res.send({ message: 'Logout successful' });
    }

    @Get('tokens')
    async getTokens(): Promise<RefreshToken[]> {
        return this.authService.getAllTokens();
    }
}
