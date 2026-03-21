import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { User } from '../src/modules/users/entities/user.entity';
import { UserSession } from '../src/modules/users/entities/user-session.entity';
import { UserOtp } from '../src/modules/users/entities/user-otp.entity';
import { Organization } from '../src/modules/organizations/entities/organization.entity';
import { OrganizationSession } from '../src/modules/organizations/entities/organization-session.entity';
import { OrganizationOtp } from '../src/modules/organizations/entities/organization-otp.entity';
import { Event } from '../src/modules/events/entities/event.entity';
import { Recurrence } from '../src/modules/events/entities/recurrence.entity';
import { Override } from '../src/modules/events/entities/override.entity';
import { Tag } from '../src/modules/tags/entities/tag.entity';
import { Ticket, TicketStatus } from '../src/modules/users/entities/ticket.entity';
import { Notification } from '../src/modules/notifications/entities/notification.entity';
import { File as FileEntity } from '../src/modules/files/entities/file.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5434,
  username: 'uevent',
  password: 'uevent',
  database: 'uevent',
  entities: [
    User, UserSession, UserOtp,
    Organization, OrganizationSession, OrganizationOtp,
    Event, Recurrence, Override,
    Tag, Ticket, Notification, FileEntity,
  ],
  synchronize: false,
});

async function seedAll() {
  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);
  const orgRepo = dataSource.getRepository(Organization);
  const eventRepo = dataSource.getRepository(Event);
  const tagRepo = dataSource.getRepository(Tag);
  const ticketRepo = dataSource.getRepository(Ticket);
  const notificationRepo = dataSource.getRepository(Notification);
  const fileRepo = dataSource.getRepository(FileEntity);

  // Tags
  let tags = await tagRepo.find();
  if (tags.length < 8) {
    const tagNames = ['music', 'theatre', 'conference', 'hackathon', 'startup', 'university', 'ngo', 'volunteering'];
    tags = await tagRepo.save(tagNames.map((name) => tagRepo.create({ name })));
  }

  // Organizations
  const orgs: Organization[] = [];
  for (let i = 0; i < 20; i++) {
    const org = orgRepo.create({
      name: faker.company.name(),
      slogan: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      avatar: faker.image.avatar(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      category: faker.helpers.arrayElement(['Education', 'IT', 'Art', 'Sport', 'Science']),
      verified: faker.datatype.boolean(),
      tags: faker.helpers.arrayElements(tags.map(t => t.name), faker.number.int({ min: 1, max: 3 })),
      city: faker.location.city(),
    });
    orgs.push(await orgRepo.save(org));
  }

  // Users
  const users: User[] = [];
  for (let i = 0; i < 30; i++) {
    const user = userRepo.create({
      username: faker.internet.username(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      phone: faker.phone.number(),
      location: faker.location.city(),
      avatar: faker.image.avatar(),
      is_banned: false,
      two_fa: false,
    });
    users.push(await userRepo.save(user));
  }

  // Events
  const events: Event[] = [];
  for (let i = 0; i < 40; i++) {
    const eventTags = faker.helpers.arrayElements(tags, faker.number.int({ min: 1, max: 3 }));
    const start = faker.date.soon();
    const end = new Date(start.getTime() + faker.number.int({ min: 1, max: 5 }) * 60 * 60 * 1000);
    const event = eventRepo.create({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      gallery: [faker.image.url(), faker.image.url()],
      time_zone: 'Europe/Kyiv',
      datetime_start: start,
      datetime_end: end,
      seats: faker.number.int({ min: 10, max: 200 }),
      location: faker.location.city(),
      tags: eventTags,
    });
    events.push(await eventRepo.save(event));
  }

  // Tickets
  for (let i = 0; i < 60; i++) {
    const ticket = ticketRepo.create({
      name: faker.commerce.productName(),
      status: faker.helpers.arrayElement(Object.values(TicketStatus)),
      description: faker.lorem.sentence(),
      datetime_start: faker.date.soon(),
      datetime_end: faker.date.soon(),
      price: Number(faker.commerce.price({ min: 10, max: 200, dec: 2 })),
      private_info: faker.lorem.sentence(),
      user: faker.helpers.arrayElement(users),
      event: faker.helpers.arrayElement(events),
    });
    await ticketRepo.save(ticket);
  }

  // Notifications
  for (let i = 0; i < 40; i++) {
    const notification = notificationRepo.create({
      name: faker.lorem.words(3),
      content: faker.lorem.sentence(),
      had_readed: faker.datatype.boolean(),
      user: faker.helpers.arrayElement(users),
    });
    await notificationRepo.save(notification);
  }

  // Files
  for (let i = 0; i < 30; i++) {
    const file = fileRepo.create({
      name: faker.system.fileName(),
      size: faker.number.int({ min: 1000, max: 1000000 }),
      src: faker.image.url(),
      ticket: faker.helpers.arrayElement(await ticketRepo.find()),
    });
    await fileRepo.save(file);
  }

  await dataSource.destroy();
  console.log('Seeded all main entities!');
}

seedAll().catch(console.error);
