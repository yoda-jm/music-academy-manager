/**
 * seed-static.ts — runs on every container startup after `prisma db push`.
 * Only inserts reference data that should always exist.
 * Safe to run multiple times (idempotent).
 */
import { PrismaClient, CourseType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Pricing rules — only seed if none exist (schema push can wipe them)
  const existing = await prisma.pricingRule.count();
  if (existing === 0) {
    await prisma.pricingRule.createMany({
      data: [
        {
          name: 'Cours particulier — 30 min',
          courseType: CourseType.PRIVATE_LESSON,
          pricePerSession: 25,
          priceMonthly: 85,
          priceYearly: 850,
          isDefault: false,
        },
        {
          name: 'Cours particulier — 45 min',
          courseType: CourseType.PRIVATE_LESSON,
          pricePerSession: 32,
          priceMonthly: 110,
          priceYearly: 1100,
          isDefault: true,
        },
        {
          name: 'Cours particulier — 60 min',
          courseType: CourseType.PRIVATE_LESSON,
          pricePerSession: 42,
          priceMonthly: 145,
          priceYearly: 1450,
          isDefault: false,
        },
        {
          name: 'Cours collectif instrument',
          courseType: CourseType.GROUP_INSTRUMENT,
          pricePerSession: 15,
          priceMonthly: 55,
          priceYearly: 550,
          isDefault: true,
        },
        {
          name: 'Formation musicale',
          courseType: CourseType.MUSIC_THEORY,
          pricePerSession: 12,
          priceMonthly: 45,
          priceYearly: 450,
          isDefault: true,
        },
        {
          name: 'Stage / Atelier',
          courseType: CourseType.WORKSHOP,
          pricePerSession: 20,
          isDefault: true,
        },
        {
          name: 'Masterclass',
          courseType: CourseType.MASTERCLASS,
          pricePerSession: 35,
          isDefault: true,
        },
      ],
    });
    console.log('✓ Pricing rules seeded');
  } else {
    console.log(`✓ Pricing rules already present (${existing} rules)`);
  }
}

main()
  .catch((e) => {
    console.error('Static seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
