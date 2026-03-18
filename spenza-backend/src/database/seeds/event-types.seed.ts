import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { EventType } from '../../modules/events/event-type.entity';

const seed = async () => {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(EventType);

  const types = [
    { name: 'payment.created', shortDescription: 'New payment initiated' },
    { name: 'payment.completed', shortDescription: 'Payment succeeded' },
    { name: 'payment.failed', shortDescription: 'Payment failed' },
    { name: 'order.created', shortDescription: 'New order placed' },
    { name: 'order.shipped', shortDescription: 'Order dispatched' },
    { name: 'order.cancelled', shortDescription: 'Order cancelled' },
    { name: 'user.registered', shortDescription: 'New user signed up' },
  ];

  for (const t of types) {
    const exists = await repo.findOneBy({ name: t.name });
    if (!exists) {
      await repo.save(repo.create(t));
      console.log(`Seeded: ${t.name}`);
    }
  }

  await AppDataSource.destroy();
  console.log('Seeding complete.');
};

seed().catch(console.error);