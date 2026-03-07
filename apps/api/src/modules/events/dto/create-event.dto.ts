export class CreateEventDto {
  name: string;
  description?: string;
  gallery?: string[];
  time_zone: string;
  datetime_start: Date;
  datetime_end: Date;
  seats?: number;
  location?: string;
  organization_id?: number;
  tags?: number[];
}
