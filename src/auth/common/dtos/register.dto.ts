import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    password: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    confirmPassword: string;

    // @IsNotEmpty()
    // role: Role;
}
