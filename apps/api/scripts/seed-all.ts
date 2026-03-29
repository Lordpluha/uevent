import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { v7 as uuidv7 } from 'uuid';
import * as argon2 from 'argon2';
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
import { Payment, PaymentStatus } from '../src/modules/payments/entities/payment.entity';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
  hashLength: 32,
};

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
    Tag, Ticket, Notification, FileEntity, Payment,
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
  const recurrenceRepo = dataSource.getRepository(Recurrence);
  const overrideRepo = dataSource.getRepository(Override);
  const paymentRepo = dataSource.getRepository(Payment);

  // Tags
  let tags = await tagRepo.find();
  if (tags.length < 8) {
    const tagNames = ['music', 'theatre', 'conference', 'hackathon', 'startup', 'university', 'ngo', 'volunteering'];
    tags = await tagRepo.save(tagNames.map((name) => tagRepo.create({ name })));
  }

  // Organizations — password: "Password1!"
  const orgPassword = await argon2.hash('Password1!', ARGON2_OPTIONS);
  const orgs: Organization[] = [];
  for (let i = 0; i < 20; i++) {
    const org = orgRepo.create({
      name: faker.company.name(),
      slogan: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      avatar: faker.image.avatar(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      password: orgPassword,
      category: faker.helpers.arrayElement(['Education', 'IT', 'Art', 'Sport', 'Science']),
      verified: faker.datatype.boolean(),
      tags: faker.helpers.arrayElements(tags.map(t => t.name), faker.number.int({ min: 1, max: 3 })),
      city: faker.location.city(),
    });
    orgs.push(await orgRepo.save(org));
  }

  // Users — password: "Password1!"
  const userPassword = await argon2.hash('Password1!', ARGON2_OPTIONS);
  const users: User[] = [];
  for (let i = 0; i < 30; i++) {
    const user = userRepo.create({
      username: faker.internet.username(),
      email: faker.internet.email(),
      password: userPassword,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      phone: faker.phone.number(),
      location: faker.location.city(),
      avatar: faker.image.avatar(),
      bio: faker.lorem.sentence(),
      website: faker.internet.url(),
      timezone: faker.location.timeZone(),
      interests: faker.helpers.arrayElements(tags.map(t => t.name), faker.number.int({ min: 1, max: 4 })),
      notifications_enabled: true,
      is_banned: false,
      two_fa: false,
    });
    users.push(await userRepo.save(user));
  }

  // Recurrences (for ~30% of events)
  const recurrences: Recurrence[] = [];
  for (let i = 0; i < 12; i++) {
    const recurrence = recurrenceRepo.create({
      rule: faker.helpers.arrayElement(['FREQ=WEEKLY;BYDAY=MO', 'FREQ=MONTHLY;BYMONTHDAY=1', 'FREQ=DAILY;COUNT=5']),
      time_zone: 'Europe/Kyiv',
      excluded_dates: [],
      additional_dates: [],
    });
    const saved = await recurrenceRepo.save(recurrence);

    // Add 1-2 overrides per recurrence
    for (let j = 0; j < faker.number.int({ min: 1, max: 2 }); j++) {
      const newStart = faker.date.soon({ days: 30 });
      const newEnd = new Date(newStart.getTime() + 2 * 60 * 60 * 1000);
      await overrideRepo.save(overrideRepo.create({
        recurrence_id: saved.id,
        new_start: newStart,
        new_end: newEnd,
        is_canceled: faker.datatype.boolean(),
      }));
    }
    recurrences.push(saved);
  }

  // Events — linked to organizations, some with recurrences
  // recurrences are OneToOne — each can only be used by one event
  let recurrenceIndex = 0;
  const events: Event[] = [];
  for (let i = 0; i < 40; i++) {
    const eventTags = faker.helpers.arrayElements(tags, faker.number.int({ min: 1, max: 3 }));
    const start = faker.date.soon({ days: 60 });
    const end = new Date(start.getTime() + faker.number.int({ min: 1, max: 5 }) * 60 * 60 * 1000);
    // assign a recurrence to first 12 events (one each), rest get none
    const recurrence = recurrenceIndex < recurrences.length ? recurrences[recurrenceIndex++] : undefined;
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
      organization: faker.helpers.arrayElement(orgs),
      recurrence,
    });
    events.push(await eventRepo.save(event));
  }

  // Tickets
  const tickets: Ticket[] = [];
  for (let i = 0; i < 60; i++) {
    const ticket = ticketRepo.create({
      name: faker.commerce.productName(),
      status: faker.helpers.arrayElement(Object.values(TicketStatus)),
      description: faker.lorem.sentence(),
      datetime_start: faker.date.soon({ days: 60 }),
      datetime_end: faker.date.soon({ days: 90 }),
      price: Number(faker.commerce.price({ min: 10, max: 200, dec: 2 })),
      private_info: faker.lorem.sentence(),
      user: faker.helpers.arrayElement(users),
      event: faker.helpers.arrayElement(events),
    });
    tickets.push(await ticketRepo.save(ticket));
  }

  // Payments (for PAID tickets)
  for (const ticket of tickets.filter(t => t.status === TicketStatus.PAID)) {
    const payment = paymentRepo.create({
      id: uuidv7(),
      stripePaymentIntentId: `pi_${faker.string.alphanumeric(24)}`,
      amount: ticket.price,
      currency: 'usd',
      status: PaymentStatus.SUCCEEDED,
      userId: ticket.user_id,
      orderId: ticket.id,
      metadata: { ticketId: ticket.id, eventId: ticket.event_id },
    });
    await paymentRepo.save(payment);
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

  // Files (linked to tickets)
  const allTickets = await ticketRepo.find();
  for (let i = 0; i < 30; i++) {
    const file = fileRepo.create({
      name: faker.system.fileName(),
      size: faker.number.int({ min: 1000, max: 1000000 }),
      src: faker.image.url(),
      ticket: faker.helpers.arrayElement(allTickets),
    });
    await fileRepo.save(file);
  }

  await dataSource.destroy();
  console.log('Seeded all main entities!');
  console.log('Login credentials for all users and orgs: email from DB, password: Password1!');
}

seedAll().catch(console.error);

