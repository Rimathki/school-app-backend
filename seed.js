import { seedRolesAndPermissions } from './role-seed.js';
import { seedUser } from './user-seed.js';

async function runSeeds() {
  await seedRolesAndPermissions();
  await seedUser();
  console.log('Seeding completed successfully!');
}

runSeeds().catch(console.error);