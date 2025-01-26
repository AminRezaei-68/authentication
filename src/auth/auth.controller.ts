/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Res, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './common/dtos/register.dto';
import { LoginDto } from './common/dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtGuard } from 'src/common/guards/jwt.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) {}

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto, @Res() res: Response) {
        const { response } = await this.authService.login(loginDto);

        const { accessToken, refreshToken } = await response;

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
    async logout(@Req() req: Request, @Res() res: Response) {
        const refreshToken = req.cookies['refresh_token'];
        const decodedRefreshToken = await this.validateToken(refreshToken);

        const logoutData = { email: decodedRefreshToken.email, userId: decodedRefreshToken.sub };
        await this.authService.logout(logoutData);
        res.cookie('access_token', '', { expires: new Date(0) });
        res.cookie('refresh_token', '', { expires: new Date(0) });
        return res.send({ message: 'Logout successful' });
    }

    async validateToken(token: string) {
        try {
            const validToken = await this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
            return validToken;
        } catch (error) {
            console.log('error', error);
        }
    }
}
