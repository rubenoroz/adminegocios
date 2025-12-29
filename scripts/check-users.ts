import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("--- Verificando Usuarios ---");
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            businessId: true,
            business: {
                select: {
                    name: true,
                    type: true
                }
            }
        }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
