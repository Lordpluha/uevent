import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';
// Load .env from the apps/api directory when running locally
dotenv.config({ path: resolve(__dirname, '../.env') });

import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { v7 as uuidv7 } from 'uuid';
import {type Options, argon2id, hash} from 'argon2';
import { User } from '../src/modules/users/entities/user.entity';
import { UserSession } from '../src/modules/users/entities/user-session.entity';
import { UserOtp } from '../src/modules/users/entities/user-otp.entity';
import { Organization } from '../src/modules/organizations/entities/organization.entity';
import { OrganizationSession } from '../src/modules/organizations/entities/organization-session.entity';
import { OrganizationOtp } from '../src/modules/organizations/entities/organization-otp.entity';
import { Event } from '../src/modules/events/entities/event.entity';
import { EventSubscription } from '../src/modules/events/entities/event-subscription.entity';
import { Recurrence } from '../src/modules/events/entities/recurrence.entity';
import { Override } from '../src/modules/events/entities/override.entity';
import { Tag } from '../src/modules/tags/entities/tag.entity';
import { Ticket, TicketStatus } from '../src/modules/tickets/entities/ticket.entity';
import { Notification } from '../src/modules/notifications/entities/notification.entity';
import { File as FileEntity } from '../src/modules/files/entities/file.entity';
import { Payment, PaymentStatus } from '../src/modules/payments/entities/payment.entity';
import { PromoCode } from '../src/modules/payments/entities/promo-code.entity';

const ARGON2_OPTIONS: Options = {
  type: argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
  hashLength: 32,
};

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5434),
  username: process.env.POSTGRES_USER ?? 'uevent',
  password: process.env.POSTGRES_PASSWORD ?? 'uevent',
  database: process.env.POSTGRES_DB ?? 'uevent',
  entities: [
    User, UserSession, UserOtp,
    Organization, OrganizationSession, OrganizationOtp,
    Event, EventSubscription, Recurrence, Override,
    Tag, Ticket, Notification, FileEntity, Payment, PromoCode,
  ],
  synchronize: false,
});

async function seedAll() {
  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);
  const orgRepo = dataSource.getRepository(Organization);
  const eventRepo = dataSource.getRepository(Event);
  const eventSubRepo = dataSource.getRepository(EventSubscription);
  const tagRepo = dataSource.getRepository(Tag);
  const ticketRepo = dataSource.getRepository(Ticket);
  const notificationRepo = dataSource.getRepository(Notification);
  const fileRepo = dataSource.getRepository(FileEntity);
  const recurrenceRepo = dataSource.getRepository(Recurrence);
  const overrideRepo = dataSource.getRepository(Override);
  const paymentRepo = dataSource.getRepository(Payment);
  const promoCodeRepo = dataSource.getRepository(PromoCode);

  // ── Tags ────────────────────────────────────────────────────────────────────
  let tags = await tagRepo.find();
  if (tags.length < 8) {
    const tagNames = ['music', 'theatre', 'conference', 'hackathon', 'startup', 'university', 'ngo', 'volunteering'];
    tags = await tagRepo.save(tagNames.map((name) => tagRepo.create({ name })));
  }

  // ── Organizations ────────────────────────────────────────────────────────────
  // password for all: Password1!
  const orgPassword = await hash('Password1!', ARGON2_OPTIONS);

  // Fixed demo org — use these credentials during the presentation
  let demoOrg = await orgRepo.findOne({ where: { email: 'demo-org@uevent.app' } });
  if (!demoOrg) {
    demoOrg = await orgRepo.save(orgRepo.create({
      name: 'Demo Company',
      slogan: 'Building the future of events',
      description: faker.lorem.paragraph(),
      avatar: faker.image.avatar(),
      phone: '+380671234567',
      email: 'demo-org@uevent.app',
      password: orgPassword,
      category: 'IT',
      verified: true,
      tags: ['conference', 'hackathon'],
      city: 'Kyiv',
      notifications_enabled: true,
    }));
  }

  const orgs: Organization[] = [demoOrg];
  for (let i = 0; i < 19; i++) {
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

  // ── Users ────────────────────────────────────────────────────────────────────
  const userPassword = await hash('Password1!', ARGON2_OPTIONS);

  // Fixed demo user — use these credentials during the presentation
  let demoUser = await userRepo.findOne({ where: { email: 'demo@uevent.app' } });
  if (!demoUser) {
    demoUser = await userRepo.save(userRepo.create({
      username: 'demo_user',
      email: 'demo@uevent.app',
      password: userPassword,
      first_name: 'Demo',
      last_name: 'User',
      phone: '+380501234567',
      location: 'Kyiv',
      avatar: faker.image.avatar(),
      bio: 'Demo account for presentations',
      timezone: 'Europe/Kyiv',
      interests: ['conference', 'hackathon', 'music'],
      notifications_enabled: true,
      is_banned: false,
      two_fa: false,
    }));
  }

  const users: User[] = [demoUser];
  for (let i = 0; i < 29; i++) {
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

  // ── Recurrences ──────────────────────────────────────────────────────────────
  const recurrences: Recurrence[] = [];
  for (let i = 0; i < 12; i++) {
    const recurrence = recurrenceRepo.create({
      rule: faker.helpers.arrayElement(['FREQ=WEEKLY;BYDAY=MO', 'FREQ=MONTHLY;BYMONTHDAY=1', 'FREQ=DAILY;COUNT=5']),
      time_zone: 'Europe/Kyiv',
      excluded_dates: [],
      additional_dates: [],
    });
    const saved = await recurrenceRepo.save(recurrence);

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

  // ── Events ───────────────────────────────────────────────────────────────────
  // online_link present  → format=online (used by format filter)
  // attendees_public=true → attendees list visible on event page
  let recurrenceIndex = 0;
  const events: Event[] = [];

  // First 5 events belong to demo org, are well-configured for demo walk-through
  const demoEventData = [
    {
      name: 'Global Tech Conference 2026',
      attendees_public: true,
      notify_new_attendees: true,
      online_link: 'https://meet.example.com/tech-conf',
      redirect_url: 'https://example.com/thank-you',
      publish_at: null,
    },
    {
      name: 'Kyiv Startup Hackathon',
      attendees_public: true,
      notify_new_attendees: true,
      online_link: null,
      redirect_url: null,
      publish_at: null,
    },
    {
      name: 'Music & Arts Festival',
      attendees_public: false,
      notify_new_attendees: false,
      online_link: null,
      redirect_url: null,
      publish_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
    {
      name: 'Web Development Workshop',
      attendees_public: true,
      notify_new_attendees: true,
      online_link: 'https://zoom.example.com/webdev',
      redirect_url: 'https://example.com/webdev-resources',
      publish_at: null,
    },
    {
      name: 'NGO Volunteering Summit',
      attendees_public: true,
      notify_new_attendees: false,
      online_link: null,
      redirect_url: null,
      publish_at: null,
    },
  ];

  for (const demo of demoEventData) {
    const start = faker.date.soon({ days: 30 });
    const end = new Date(start.getTime() + faker.number.int({ min: 2, max: 6 }) * 60 * 60 * 1000);
    const eventTags = faker.helpers.arrayElements(tags, faker.number.int({ min: 1, max: 3 }));
    const event = eventRepo.create({
      name: demo.name,
      description: faker.lorem.paragraphs(2),
      gallery: [faker.image.url(), faker.image.url(), faker.image.url()],
      time_zone: 'Europe/Kyiv',
      datetime_start: start,
      datetime_end: end,
      seats: faker.number.int({ min: 20, max: 300 }),
      location: demo.online_link ? null : faker.location.city(),
      location_map_url: demo.online_link ? null : `https://maps.google.com/?q=${faker.location.latitude()},${faker.location.longitude()}`,
      online_link: demo.online_link,
      tags: eventTags,
      organization: demoOrg,
      attendees_public: demo.attendees_public,
      notify_new_attendees: demo.notify_new_attendees,
      redirect_url: demo.redirect_url,
      publish_at: demo.publish_at,
    });
    events.push(await eventRepo.save(event));
  }

  // Remaining 35 events spread across all orgs
  for (let i = 0; i < 35; i++) {
    const isOnline = faker.datatype.boolean();
    const start = faker.date.soon({ days: 60 });
    const end = new Date(start.getTime() + faker.number.int({ min: 1, max: 5 }) * 60 * 60 * 1000);
    const eventTags = faker.helpers.arrayElements(tags, faker.number.int({ min: 1, max: 3 }));
    const recurrence = recurrenceIndex < recurrences.length ? recurrences[recurrenceIndex++] : undefined;
    const event = eventRepo.create({
      name: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      gallery: [faker.image.url(), faker.image.url()],
      time_zone: 'Europe/Kyiv',
      datetime_start: start,
      datetime_end: end,
      seats: faker.number.int({ min: 10, max: 200 }),
      location: isOnline ? null : faker.location.city(),
      location_map_url: isOnline ? null : `https://maps.google.com/?q=${faker.location.latitude()},${faker.location.longitude()}`,
      online_link: isOnline ? faker.internet.url() : null,
      tags: eventTags,
      organization: faker.helpers.arrayElement(orgs),
      attendees_public: faker.datatype.boolean(),
      notify_new_attendees: faker.datatype.boolean(),
      recurrence,
    });
    events.push(await eventRepo.save(event));
  }

  // ── Ticket types (definitions, no user — available to purchase) ──────────────
  // Each event gets 1-3 ticket type definitions with READY status
  const ticketTypes: Ticket[] = [];
  for (const event of events) {
    const count = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < count; i++) {
      const isLimited = faker.datatype.boolean();
      const total = isLimited ? faker.number.int({ min: 20, max: 200 }) : null;
      const sold = isLimited && total ? faker.number.int({ min: 0, max: Math.floor(total * 0.6) }) : faker.number.int({ min: 0, max: 50 });
      const ticket = ticketRepo.create({
        name: faker.helpers.arrayElement(['Standard', 'VIP', 'Early Bird', 'Student', 'Group']),
        status: TicketStatus.READY,
        description: faker.lorem.sentence(),
        datetime_start: event.datetime_start,
        datetime_end: event.datetime_end,
        price: Number(faker.commerce.price({ min: 0, max: 200, dec: 2 })),
        quantity_limited: isLimited,
        quantity_total: total,
        quantity_sold: sold,
        event,
        user: null,
      });
      ticketTypes.push(await ticketRepo.save(ticket));
    }
  }

  // ── Purchased tickets (demo user + random users) ─────────────────────────────
  const purchasedTickets: Ticket[] = [];
  // Demo user has 3 purchased tickets for the first demo event
  for (let i = 0; i < 3; i++) {
    const base = ticketTypes.find(t => t.event_id === events[0].id);
    if (base) {
      const t = ticketRepo.create({
        name: base.name,
        status: TicketStatus.PAID,
        description: base.description,
        datetime_start: base.datetime_start,
        datetime_end: base.datetime_end,
        price: base.price,
        quantity_limited: false,
        quantity_total: null,
        quantity_sold: 0,
        event: events[0],
        user: demoUser,
      });
      purchasedTickets.push(await ticketRepo.save(t));
    }
  }
  // Other random purchased tickets
  for (let i = 0; i < 40; i++) {
    const baseType = faker.helpers.arrayElement(ticketTypes);
    const ticket = ticketRepo.create({
      name: baseType.name,
      status: TicketStatus.PAID,
      description: baseType.description,
      datetime_start: baseType.datetime_start,
      datetime_end: baseType.datetime_end,
      price: baseType.price,
      quantity_limited: false,
      quantity_total: null,
      quantity_sold: 0,
      event: { id: baseType.event_id } as Event,
      user: faker.helpers.arrayElement(users),
    });
    purchasedTickets.push(await ticketRepo.save(ticket));
  }

  // ── Payments (for purchased tickets) ─────────────────────────────────────────
  for (const ticket of purchasedTickets) {
    const payment = paymentRepo.create({
      id: uuidv7(),
      stripePaymentIntentId: `pi_${faker.string.alphanumeric(24)}`,
      amount: ticket.price,
      currency: 'usd',
      status: PaymentStatus.SUCCEEDED,
      userId: ticket.user_id,
      organizationId: ticket.event?.organization_id ?? null,
      orderId: ticket.id,
      metadata: { ticketId: ticket.id, eventId: ticket.event_id },
    });
    await paymentRepo.save(payment);
  }

  // ── Promo codes ───────────────────────────────────────────────────────────────
  // Each of the first 5 (demo) events gets 3 promo codes with different discounts
  for (const event of events.slice(0, 5)) {
    const discounts = [10, 25, 50];
    for (const discount of discounts) {
      await promoCodeRepo.save(promoCodeRepo.create({
        code: `DEMO${discount}-${event.id.slice(0, 6).toUpperCase()}`,
        discountPercent: discount,
        organizationId: demoOrg.id,
        eventId: event.id,
        isActive: true,
        maxUses: 100,
        usedCount: faker.number.int({ min: 0, max: 30 }),
        startsAt: null,
        endsAt: null,
      }));
    }
  }
  // A few org-wide promo codes (not tied to specific event)
  for (const org of orgs.slice(0, 5)) {
    await promoCodeRepo.save(promoCodeRepo.create({
      code: `ORG-${org.id.slice(0, 6).toUpperCase()}`,
      discountPercent: faker.number.int({ min: 5, max: 30 }),
      organizationId: org.id,
      eventId: null,
      isActive: true,
      maxUses: null,
      usedCount: 0,
      startsAt: null,
      endsAt: null,
    }));
  }

  // ── Event subscriptions ───────────────────────────────────────────────────────
  // Demo user is subscribed to first 3 demo events
  for (const event of events.slice(0, 3)) {
    const existing = await eventSubRepo.findOne({ where: { user_id: demoUser.id, event_id: event.id } });
    if (!existing) {
      await eventSubRepo.save(eventSubRepo.create({ user_id: demoUser.id, event_id: event.id }));
    }
  }
  // Random subscriptions from other users
  for (let i = 0; i < 50; i++) {
    const user = faker.helpers.arrayElement(users);
    const event = faker.helpers.arrayElement(events);
    const existing = await eventSubRepo.findOne({ where: { user_id: user.id, event_id: event.id } });
    if (!existing) {
      await eventSubRepo.save(eventSubRepo.create({ user_id: user.id, event_id: event.id }));
    }
  }

  // ── Organization followers ────────────────────────────────────────────────────
  // Demo user follows demo org and 2 random orgs
  const demoOrgWithFollowers = await orgRepo.findOne({ where: { id: demoOrg.id }, relations: ['followers'] });
  if (demoOrgWithFollowers && !demoOrgWithFollowers.followers.find(f => f.id === demoUser.id)) {
    demoOrgWithFollowers.followers.push(demoUser);
    await orgRepo.save(demoOrgWithFollowers);
  }
  for (const org of faker.helpers.arrayElements(orgs.slice(1), 2)) {
    const orgWithFollowers = await orgRepo.findOne({ where: { id: org.id }, relations: ['followers'] });
    if (orgWithFollowers && !orgWithFollowers.followers.find(f => f.id === demoUser.id)) {
      orgWithFollowers.followers.push(demoUser);
      await orgRepo.save(orgWithFollowers);
    }
  }
  // Random followers across orgs
  for (let i = 0; i < 60; i++) {
    const user = faker.helpers.arrayElement(users);
    const org = faker.helpers.arrayElement(orgs);
    const orgWithFollowers = await orgRepo.findOne({ where: { id: org.id }, relations: ['followers'] });
    if (orgWithFollowers && !orgWithFollowers.followers.find(f => f.id === user.id)) {
      orgWithFollowers.followers.push(user);
      await orgRepo.save(orgWithFollowers);
    }
  }

  // ── Notifications ─────────────────────────────────────────────────────────────
  // Demo user gets real-looking notifications with links
  const demoNotifications = [
    { name: 'New event from Demo Company', content: 'Demo Company published a new event: Global Tech Conference 2026', link: `/events/${events[0].id}` },
    { name: 'Ticket purchase confirmed', content: 'Your ticket for Global Tech Conference 2026 has been confirmed.', link: `/events/${events[0].id}` },
    { name: 'Event reminder', content: 'Global Tech Conference 2026 starts in 24 hours!', link: `/events/${events[0].id}` },
    { name: 'New follower activity', content: 'Demo Company posted a new event you might like.', link: `/organizations/${demoOrg.id}` },
  ];
  for (let i = 0; i < demoNotifications.length; i++) {
    await notificationRepo.save(notificationRepo.create({
      name: demoNotifications[i].name,
      content: demoNotifications[i].content,
      is_read: i > 1, // first 2 unread, rest read
      link: demoNotifications[i].link,
      user: demoUser,
    }));
  }
  // Random notifications for other users
  for (let i = 0; i < 40; i++) {
    const event = faker.helpers.arrayElement(events);
    await notificationRepo.save(notificationRepo.create({
      name: faker.lorem.words(3),
      content: faker.lorem.sentence(),
      is_read: faker.datatype.boolean(),
      link: faker.helpers.arrayElement([`/events/${event.id}`, `/organizations/${faker.helpers.arrayElement(orgs).id}`, null]),
      user: faker.helpers.arrayElement(users),
    }));
  }

  // ── Files (linked to purchased tickets) ──────────────────────────────────────
  for (let i = 0; i < 20; i++) {
    const file = fileRepo.create({
      name: faker.system.fileName(),
      size: faker.number.int({ min: 1000, max: 1000000 }),
      src: faker.image.url(),
      ticket: faker.helpers.arrayElement(purchasedTickets),
    });
    await fileRepo.save(file);
  }

  await dataSource.destroy();

  console.log('\n✅ Seed complete!\n');
  console.log('═══════════════════════════════════════════');
  console.log('  DEMO CREDENTIALS');
  console.log('═══════════════════════════════════════════');
  console.log('  User:         demo@uevent.app / Password1!');
  console.log('  Organization: demo-org@uevent.app / Password1!');
  console.log('═══════════════════════════════════════════');
  console.log('  All other seeded accounts also use: Password1!');
  console.log('  (email visible in the database)');
  console.log('═══════════════════════════════════════════\n');
}

seedAll().catch(console.error);
