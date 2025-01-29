import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokensRepository } from 'src/prisma/repositories/tokens.repository';
import { ConfigService } from '@nestjs/config';
import { JwtUtil } from '../utilities/jwt.util';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly tokensRepository: TokensRepository,
        private readonly configService: ConfigService,
        private readonly jwtUtil: JwtUtil,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // try {
        const accessToken = request.cookies['access_token'];
        const refreshToken = request.cookies['refresh_token'];

        const decodedAccessToken = await this.validateAccessToken(accessToken);
        const decodedRefreshToken = await this.validateRefreshToken(refreshToken);

        console.log('in jwt gaurd decode access token : ', decodedAccessToken);

        if (decodedAccessToken && decodedRefreshToken) {
            console.log('Access Token does not expired go ahead.');

            if (decodedAccessToken.id !== decodedRefreshToken.id) {
                throw new UnauthorizedException('Credential failed.');
            }

            return true;
        } else {
            /*
            const decodedRefreshToken = await this.validateToken(refreshToken);
            if (decodedRefreshToken) {
                console.log('Refresh Token does not expired.');
                console.log('refresh token:', decodedRefreshToken);
                console.log('refresh token:', refreshToken);
                const data = { id: decodedRefreshToken.sub };
                const databaseRefrshToken = await this.tokensRepository.findOne(data);

                console.log('database refresh token:', databaseRefrshToken);

                if (!databaseRefrshToken || decodedRefreshToken.sub !== databaseRefrshToken.userId) {
                    throw new UnauthorizedException('Invalid Refresh Token.');
                }

                console.log('database refresh token :', databaseRefrshToken);
                const payload = { id: decodedRefreshToken.sub, email: decodedRefreshToken.email };
                */

            // new logic
            // const decodedRefreshToken = await this.validateRefreshToken(refreshToken);
            const { id, email } = decodedRefreshToken;
            const payload = { id: id, email: email };
            //
            const newTokens = await this.jwtUtil.createTokens(payload);
            console.log('new tokens:', newTokens);

            request.res.cookie('access_token', newTokens.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 1 * 60 * 1000,
            });

            request.res.cookie('refresh_token', newTokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return true;
            /*
            } else {
                throw new BadRequestException('You should login again.');
            }
            */
        }
        // const decodedAccessToken = this.jwtService.decode(accessToken);
        // const decodedRefreshToken = this.jwtService.decode(refreshToken);

        // if (decodedAccessToken.sub !== decodedRefreshToken.sub) {
        //     throw new UnauthorizedException('Invalid Tokens.');
        // }

        // const currentTime: Date = new Date();
        // const accessTokenExpTime: Date = new Date(decodedAccessToken.exp * 1000);
        // const refreshTokenExpTime: Date = new Date(decodedRefreshToken.exp * 1000);

        // if (accessTokenExpTime > currentTime) {
        //     console.log('Access Token does not expired go ahead.');
        //     return true;            console.log('expire time: ', new Date(validToken.exp * 1000));

        // } else {
        //     console.log('Access Token does expired.');
        //     if (refreshTokenExpTime > currentTime) {
        //         console.log('Refresh Token does not expired.');
        //         console.log('refresh token:', decodedRefreshToken);
        //         console.log('refresh token:', refreshToken);
        //         const databaseRefrshToken = await this.prisma.refreshToken.findUnique({ where: { userId: decodedRefreshToken.sub } });

        //         console.log('database refresh token:', databaseRefrshToken);

        //         if (!databaseRefrshToken || decodedRefreshToken.sub !== databaseRefrshToken.userId) {
        //             throw new UnauthorizedException('Invalid Refresh Token.');
        //         }

        //         console.log('database refresh token :', databaseRefrshToken);
        //         const newTokens = await this.authService.createToken(decodedRefreshToken.sub, decodedRefreshToken.email);
        //         console.log('new tokens:', newTokens);
        //         request.res.cookie('access_token', newTokens.accessToken, {
        //             httpOnly: true,
        //             secure: process.env.NODE_ENV === 'production',
        //             maxAge: 3 * 60 * 1000,
        //         });

        //         request.res.cookie('refresh_token', newTokens.refreshToken, {
        //             httpOnly: true,
        //             secure: process.env.NODE_ENV === 'production',
        //             maxAge: 7 * 24 * 60 * 60 * 1000,
        //         });

        //         return true;
        //     } else {
        //         throw new BadRequestException('You should login again.');
        //     }
        // }
        // } catch (error) {
        //     throw new UnauthorizedException('Invalid or expired tokens, You should login again.');
    }

    private async validateAccessToken(token: string): Promise<DecodeToken> {
        try {
            const validToken = await this.jwtService.verifyAsync(token, { secret: this.configService.get('JWT_SECRET_ACCESS_TOKEN') });
            return validToken;
        } catch (error) {
            console.log('error', error);
        }
    }

    private async validateRefreshToken(refreshToken: string): Promise<DecodeToken> {
        // const decodedRefreshToken = await this.validateToken(refreshToken);
        try {
            const decodedRefreshToken = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_SECRET_REFRESH_TOKEN'),
            });

            if (decodedRefreshToken) {
                console.log('Refresh Token does not expired.');
                console.log('refresh token:', decodedRefreshToken);
                console.log('refresh token:', refreshToken);
                const databaseRefrshToken = await this.tokensRepository.findOne(decodedRefreshToken.id);

                console.log('database refresh token:', databaseRefrshToken);

                if (!databaseRefrshToken || refreshToken !== databaseRefrshToken.token) {
                    throw new UnauthorizedException('Invalid Refresh Token.');
                }

                console.log('database refresh token :', databaseRefrshToken);
                return decodedRefreshToken;
            }
        } catch (error) {
            // throw new BadRequestException('You should login again.');
            throw error;
        }
    }
}
