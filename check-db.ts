import { prisma } from "./src/lib/prisma";

async function main() {
    const users = await prisma.user.findMany({
        include: {
            business: true
        }
    });
    console.log("Users:", JSON.stringify(users, null, 2));

    const businesses = await prisma.business.findMany();
    console.log("Businesses:", JSON.stringify(businesses, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
