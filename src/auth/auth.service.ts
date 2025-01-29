/* eslint-disable prettier/prettier */
import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './common/dtos/register.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './common/dtos/login.dto';
import * as bcrypt from 'bcrypt';
import { ClientProxy } from '@nestjs/microservices';
import { TokensRepository } from 'src/prisma/repositories/tokens.repository';
import { UsersRepository } from 'src/prisma/repositories/users.repository';
import { ConfigService } from '@nestjs/config';
import { JwtUtil } from './common/utilities/jwt.util';

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly tokensRepository: TokensRepository,
        private readonly usersRepository: UsersRepository,
        private readonly jwtUtil: JwtUtil,
        @Inject('LOGGER_SERVICE') private readonly client: ClientProxy,
    ) {}

    async register(registerDto: RegisterDto): Promise<RegisterResponse> {
        try {
            const { email, password, confirmPassword } = registerDto;

            if (password !== confirmPassword) {
                throw new BadRequestException('Please enter the same password.');
            }

            // const user = await this.userRepository.findByEmail(email);
            const user = await this.usersRepository.findOne({ email });

            if (user) {
                throw new BadRequestException(`The user with email ${email} is exist.`);
            }
            const hashedPassword = await this.hashPassword(password);
            const crateUserData = { email: email, password: hashedPassword };
            const newUser = await this.usersRepository.create(crateUserData);

            this.client.emit('log', { action: 'register', email });

            const returnUser = { id: newUser.id, email: newUser.email };

            return { message: 'You register successfully.', returnUser };
        } catch (error) {
            // throw new Error('Something wrong. The user does not create.');
            throw error;
        }
    }

    async login(loginDto: LoginDto): Promise<TokenResponse> {
        const { email, password } = loginDto;

        // const user = await this.usersRepository.findByEmail(email);
        const user = await this.usersRepository.findOne({ email });

        if (!user) {
            throw new NotFoundException('The user does not exist.');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Credential failed.');
        }

        const payload = { id: user.id, email: user.email };

        const { accessToken, refreshToken } = await this.jwtUtil.createTokens(payload);

        this.client.emit('log', { action: 'login', email });
        console.log('data send to logger.');

        return { accessToken, refreshToken };
    }

    async logout(refreshToken: string): Promise<void> {
        const decodedRefreshToken = await this.validateRefreshToken(refreshToken);
        const { id, email } = decodedRefreshToken;
        console.log(`The user with email : ${email} is logout.`);
        console.log('the id is: ', id);
        const deletedRefreshToken = await this.tokensRepository.deleteToken(id);
        console.log(`the "${deletedRefreshToken}" refresh token deleted.`);

        this.client.emit('log', { action: 'logout', email });
    }

    async getAllTokens(): Promise<RefreshToken[]> {
        return this.tokensRepository.findAll();
    }

    // async createToken(data: CreateToken): Promise<TokenResponse> {
    //     const { id, email } = data;
    //     const payload = { sub: id, email: email };

    //     const accessToken = await this.jwtService.signAsync(payload, {
    //         expiresIn: '1m',
    //         secret: this.configService.get('JWT_SECRET_Access_Token'),
    //     });
    //     const refreshToken = await this.jwtService.signAsync(payload, {
    //         expiresIn: '2m',
    //         secret: this.configService.get('JWT_SECRET_Refresh_Token'),
    //     });

    //     const saveData = { id: id, token: refreshToken };
    //     await this.tokensRepository.saveToken(saveData);

    //     return { accessToken: accessToken, refreshToken: refreshToken };
    // }

    private async validateRefreshToken(refreshToken: string): Promise<DecodeToken> {
        try {
            const validToken = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_SECRET_REFRESH_TOKEN'),
            });
            console.log('in validate refresh token: ', validToken);
            return validToken;
        } catch (error) {
            console.log('error', error);
        }
    }

    private async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }
}
