import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = process.env.SUPERADMIN_EMAIL || "superadmin@adminegocios.com";
    const password = process.env.SUPERADMIN_PASSWORD || "SuperAdmin123!";

    console.log(`Creating/Updating Super Admin with email: ${email}`);

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: "SUPERADMIN",
            password: hashedPassword
        },
        create: {
            email,
            name: "Super Admin",
            role: "SUPERADMIN",
            password: hashedPassword,
        },
    });

    console.log("------------------------------------------");
    console.log(`✅ User created/updated successfully!`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👑 Role: ${user.role}`);
    console.log("------------------------------------------");
}

main()
    .catch((e) => {
        console.error("❌ Error creating superadmin:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
