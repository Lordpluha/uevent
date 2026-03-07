export class CreateOrganizationDto {
  name: string;
  email: string;
  password: string;
  slogan?: string;
  description?: string;
  avatar?: string;
  phone?: string;
}
