
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("Checking user roles...");
    const users = await prisma.user.findMany({
        select: { email: true, role: true, name: true }
    });
    console.table(users);
}

main();
