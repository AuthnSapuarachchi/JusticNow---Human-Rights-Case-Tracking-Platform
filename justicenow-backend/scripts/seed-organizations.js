/**
 * Seeds the EP-06 legal directory with the placeholder Sri Lankan organisations
 * that previously lived as mock data in the mobile app.
 *
 * Idempotent - matches on name, so re-running updates instead of duplicating.
 * These are plausible but fictional bodies; nothing here implies a real
 * organisation endorses the app.
 */

require('dotenv').config();
const prisma = require('../src/config/db');

const ORGANIZATIONS = [
  {
    name: 'Colombo Legal Aid Centre',
    description: 'Free legal advice and court representation for low-income families across the Western Province.',
    contactEmail: 'help@colombolegalaid.lk',
    phone: '+94 11 234 5678',
    verified: true,
    languages: 'si,ta,en',
    categories: 'legalAid,humanRights',
    isFree: true,
    distanceKm: 2.4,
    location: 'Colombo 07',
  },
  {
    name: "Workers' Rights Collective",
    description: 'Supports employees facing unfair dismissal, unpaid wages and unsafe working conditions.',
    contactEmail: 'contact@workersrights.lk',
    phone: '+94 11 345 6789',
    verified: true,
    languages: 'si,ta,en',
    categories: 'workplaceRights,legalAid',
    isFree: true,
    distanceKm: 5.1,
    location: 'Kotahena, Colombo 13',
  },
  {
    name: "Women's Advocacy Network",
    description: 'Legal support and counselling for women facing domestic violence, harassment or discrimination.',
    contactEmail: 'support@womensadvocacy.lk',
    phone: '+94 11 456 7890',
    verified: true,
    languages: 'si,en',
    categories: 'womensRights,counselling',
    isFree: true,
    distanceKm: 8.0,
    location: 'Nugegoda',
  },
  {
    name: 'Jaffna Community Law Centre',
    description: 'Community legal clinic serving the Northern Province, with a focus on land and property disputes.',
    contactEmail: 'info@jaffnalaw.lk',
    phone: '+94 21 222 3344',
    verified: true,
    languages: 'ta,en',
    categories: 'landRights,legalAid,humanRights',
    isFree: true,
    distanceKm: 12.6,
    location: 'Jaffna',
  },
  {
    name: 'Kandy Human Rights Clinic',
    description: 'Documents human-rights violations and assists complainants before the Human Rights Commission.',
    contactEmail: 'clinic@kandyhr.lk',
    phone: '+94 81 220 1122',
    verified: true,
    languages: 'si,ta,en',
    categories: 'humanRights',
    isFree: true,
    distanceKm: 15.3,
    location: 'Kandy',
  },
  {
    name: 'Silva & Associates',
    description: 'Private practice handling employment disputes and constitutional matters. Initial consultation chargeable.',
    contactEmail: 'chambers@silvaassociates.lk',
    phone: '+94 11 555 0199',
    verified: false,
    languages: 'si,en',
    categories: 'workplaceRights,legalAid',
    isFree: false,
    distanceKm: 3.7,
    location: 'Colombo 03',
  },
  {
    name: 'Child Protection Legal Unit',
    description: 'Legal assistance in cases of child abuse, exploitation and denial of access to education.',
    contactEmail: 'help@childprotection.lk',
    phone: '+94 11 777 8899',
    verified: true,
    languages: 'si,ta,en',
    categories: 'childRights,counselling',
    isFree: true,
    distanceKm: 6.9,
    location: 'Rajagiriya',
  },
  {
    name: 'Galle Legal Support Trust',
    description: 'Southern Province legal aid, including assistance for fisher communities and coastal land disputes.',
    contactEmail: 'trust@gallelegal.lk',
    phone: '+94 91 223 4455',
    verified: false,
    languages: 'si,en',
    categories: 'legalAid,landRights',
    isFree: true,
    distanceKm: 22.4,
    location: 'Galle',
  },
];

async function main() {
  for (const org of ORGANIZATIONS) {
    // No unique constraint on name, so find-then-write rather than upsert.
    const existing = await prisma.legalOrganization.findFirst({ where: { name: org.name } });
    if (existing) {
      await prisma.legalOrganization.update({ where: { id: existing.id }, data: org });
      console.log(`Updated ${org.name}`);
    } else {
      await prisma.legalOrganization.create({ data: org });
      console.log(`Created ${org.name}`);
    }
  }
  console.log('\nOrganisations seeded.');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
