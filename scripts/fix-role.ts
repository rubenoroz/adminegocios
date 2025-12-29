import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const email = "rubenoroz@gmail.com";
    console.log(`--- Actualizando rol para ${email} ---`);
    const user = await prisma.user.update({
        where: { email },
        data: { role: "OWNER" }
    });
    console.log("Usuario actualizado:", user.email, "Nuevo rol:", user.role);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
