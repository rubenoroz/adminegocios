
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing DB Connection...');
    const count = await prisma.user.count();
    console.log('User count:', count);
}

main()
    .catch((e) => {
        console.error('DB Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
