
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcrypt');
const prisma = new PrismaClient();

const EMAIL = process.argv[2] || 'admin@admin.com';
const PASSWORD = process.argv[3] || 'admin123';
const NAME = 'Admin User';

async function main() {
    console.log(`Creating/Updating user: ${EMAIL}`);

    const hashedPassword = await hash(PASSWORD, 12);

    // Find closest business
    const business = await prisma.business.findFirst();
    if (!business) throw new Error('No business found to attach user to.');

    const user = await prisma.user.upsert({
        where: { email: EMAIL },
        update: {
            password: hashedPassword,
            role: 'OWNER',
            businessId: business.id
        },
        create: {
            email: EMAIL,
            password: hashedPassword,
            name: NAME,
            role: 'OWNER',
            businessId: business.id,
            businessType: business.type
        }
    });

    console.log('✅ User created/updated successfully!');
    console.log('Email:', user.email);
    console.log('Password:', PASSWORD);
    console.log('Role:', user.role);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
