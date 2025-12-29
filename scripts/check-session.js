
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing Session Table...');
    const count = await prisma.session.count();
    console.log('Session count:', count);
}

main()
    .catch((e) => {
        console.error('DB Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
