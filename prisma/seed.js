const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const candidates = [
    { name: 'Budi Santoso', vision: 'Mewujudkan kampus yang inovatif dan inklusif.', mission: '1. Inovasi\n2. Inklusif' },
    { name: 'Siti Aminah', vision: 'Fasilitas yang lebih baik untuk kesejahteraan mahasiswa.', mission: '1. Fasilitas\n2. Kesejahteraan' },
    { name: 'Reza Pratama', vision: 'Aktif, kritis, dan berdaya saing global.', mission: '1. Kritis\n2. Berdaya saing' }
  ];

  for (const c of candidates) {
    await prisma.candidate.create({ data: c });
  }

  console.log('Database seeded with candidates.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
