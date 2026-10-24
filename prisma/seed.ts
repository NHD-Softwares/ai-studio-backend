// Import your existing Prisma client instance, the same one the app uses.
import { prisma } from '../src/lib/prisma.js'; // adjust path

// ---- 1. The data (edit numbers here, not in the logic below) ----
// Prices are in MINOR units: 150 EGP = 15000 piastres, $5 = 500 cents.

const creditPacks = [
  { id: 'credit_pack_20', name: '20 credits', credits: 20, egp: 150_00, usd: 5_00 },
  { id: 'credit_pack_40', name: '40 credits', credits: 40, egp: 300_00, usd: 10_00 },
  { id: 'credit_pack_100', name: '100 credits', credits: 100, egp: 650_00, usd: 20_00 },
];

const subscriptionTiers = [
  { id: 'sub_plan_1', name: 'Starter', monthlyCredits: 65, egp: 350_00, usd: 15_00 },
  { id: 'sub_plan_2', name: 'Growth', monthlyCredits: 190, egp: 900_00, usd: 29_00 },
  { id: 'sub_plan_3', name: 'Pro', monthlyCredits: 400, egp: 1600_00, usd: 59_00 },
];

// ---- 2. The logic ----

async function main() {
  for (const pack of creditPacks) {
    // Fixed ids + upsert: running the seed twice updates rows instead of duplicating them.
    await prisma.creditPlan.upsert({
      where: { id: pack.id },
      update: { name: pack.name, credits: pack.credits },
      create: { id: pack.id, name: pack.name, credits: pack.credits },
    });

    // One Price row per currency for this plan.
    for (const [currency, amountMinor] of [
      ['EGP', pack.egp],
      ['USD', pack.usd],
    ] as const) {
      await prisma.price.upsert({
        where: { creditPlanId_currency: { creditPlanId: pack.id, currency } },
        update: { amountMinor },
        create: { creditPlanId: pack.id, currency, amountMinor },
      });
    }
  }

  for (const tier of subscriptionTiers) {
    await prisma.subscriptionPlan.upsert({
      where: { id: tier.id },
      update: { name: tier.name, monthlyCredits: tier.monthlyCredits },
      create: { id: tier.id, name: tier.name, monthlyCredits: tier.monthlyCredits },
    });

    for (const [currency, amountMinor] of [
      ['EGP', tier.egp],
      ['USD', tier.usd],
    ] as const) {
      await prisma.price.upsert({
        where: { subscriptionPlanId_currency: { subscriptionPlanId: tier.id, currency } },
        update: { amountMinor },
        create: { subscriptionPlanId: tier.id, currency, amountMinor },
      });
    }
  }

  console.log('Seeded plans and prices');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
