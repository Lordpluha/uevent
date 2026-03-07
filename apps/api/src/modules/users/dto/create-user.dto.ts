export class CreateUserDto {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    location?: string;
    avatar?: string;
}