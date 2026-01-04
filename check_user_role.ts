
import { prisma } from "./src/lib/prisma";

async function main() {
    const email = "rubenoroz@gmail.com";
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, businessId: true }
    });
    console.log("User:", user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
