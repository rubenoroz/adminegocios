import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function recreateUserAndBusiness() {
    console.log("🔄 Recreando usuario y negocio...");

    try {
        // Crear negocio con plan Free
        const business = await prisma.business.create({
            data: {
                name: "Mi Negocio",
                type: "SCHOOL",
                planId: "free",
                coursesCount: 0,
                teachersCount: 0,
                studentsCount: 0,
                inventoryCount: 0
            }
        });

        console.log("✅ Negocio creado:", business.name);

        // Crear sucursal principal
        const branch = await prisma.branch.create({
            data: {
                name: "Principal",
                businessId: business.id
            }
        });

        console.log("✅ Sucursal creada:", branch.name);

        // Preguntar por email y contraseña
        console.log("\n📝 Ingresa tus datos:");
        const email = "admin@example.com"; // Cambiar por tu email
        const password = "admin123"; // Cambiar por tu contraseña

        // Crear usuario con rol SUPERADMIN
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: "Super Admin",
                role: "SUPERADMIN",
                businessId: business.id,
                branchId: branch.id,
                status: "ACTIVE"
            }
        });

        console.log("✅ Usuario creado:", user.email);
        console.log("\n🎉 ¡Listo! Puedes iniciar sesión con:");
        console.log("   Email:", email);
        console.log("   Contraseña:", password);
        console.log("\n⚠️  IMPORTANTE: Cambia el email y contraseña en este script antes de ejecutarlo");

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

recreateUserAndBusiness();
