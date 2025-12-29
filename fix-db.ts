import { prisma } from "./src/lib/prisma";

async function main() {
    const userEmail = "rubenoroz@gmail.com";

    // 1. Create Business
    const business = await prisma.business.create({
        data: {
            name: "Acapella Business",
            type: "STORE", // Defaulting to STORE
            primaryColor: "#000000",
            sidebarColor: "#0f172a"
        }
    });
    console.log("Created Business:", business);

    // 2. Link User to Business
    const updatedUser = await prisma.user.update({
        where: { email: userEmail },
        data: { businessId: business.id }
    });
    console.log("Updated User:", updatedUser);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
