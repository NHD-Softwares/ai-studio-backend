import { prisma } from '../src/lib/prisma.js';
import { logger } from '../src/lib/logger.js';

const main = async (): Promise<void> => {
  logger.info('🌱 Seeding database...');

  await prisma.post.deleteMany();

  const post1 = await prisma.post.create({
    data: {
      title: 'Welcome to AI Studio Backend',
      content: 'Production-ready Express + TypeScript starter template.',
      published: true,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: 'Caching with Upstash Redis',
      content: 'Serverless-friendly caching layer with cache-aside pattern.',
      published: false,
    },
  });

  logger.info({ postCount: 2, posts: [post1.id, post2.id] }, '🌱 Database seeded successfully.');
};

main()
  .catch((err) => {
    logger.error({ err }, '❌ Error during database seeding');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
