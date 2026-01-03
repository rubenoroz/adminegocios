import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function syncEmployeesToUsers() {
    console.log('🔍 Iniciando sincronización de Empleados a Usuarios...\n');

    try {
        // 1. Obtener todos los empleados con rol TEACHER
        const teacherEmployees = await prisma.employee.findMany({
            where: {
                role: 'TEACHER'
            },
            include: {
                business: true,
                branches: true
            }
        });

        console.log(`📊 Encontrados ${teacherEmployees.length} empleados con rol TEACHER\n`);

        let created = 0;
        let existing = 0;
        let errors = 0;

        for (const employee of teacherEmployees) {
            if (!employee.email) {
                console.log(`⚠️  Empleado ${employee.firstName} ${employee.lastName} no tiene email, saltando...`);
                errors++;
                continue;
            }

            // Verificar si ya existe un usuario con ese email
            const existingUser = await prisma.user.findUnique({
                where: { email: employee.email }
            });

            if (existingUser) {
                console.log(`✓ Usuario ya existe para ${employee.firstName} ${employee.lastName} (${employee.email})`);
                existing++;
            } else {
                // Crear el usuario
                try {
                    const hashedPassword = await bcrypt.hash('password123', 10);
                    const firstBranchId = employee.branches?.[0]?.id || null;

                    const newUser = await prisma.user.create({
                        data: {
                            name: `${employee.firstName} ${employee.lastName}`,
                            email: employee.email,
                            password: hashedPassword,
                            role: 'TEACHER',
                            businessId: employee.businessId,
                            branchId: firstBranchId,
                            status: 'ACTIVE'
                        }
                    });

                    console.log(`✓ Usuario creado para ${employee.firstName} ${employee.lastName} (${employee.email})`);
                    created++;
                } catch (error) {
                    console.error(`✗ Error creando usuario para ${employee.firstName} ${employee.lastName}:`, error);
                    errors++;
                }
            }
        }

        console.log('\n📈 Resumen de sincronización:');
        console.log(`   - Usuarios creados: ${created}`);
        console.log(`   - Usuarios existentes: ${existing}`);
        console.log(`   - Errores: ${errors}`);
        console.log(`   - Total procesado: ${teacherEmployees.length}`);

        // 2. Verificar usuarios TEACHER sin empleado correspondiente
        console.log('\n🔍 Verificando usuarios TEACHER sin empleado correspondiente...\n');

        const teacherUsers = await prisma.user.findMany({
            where: {
                role: 'TEACHER'
            }
        });

        let usersWithoutEmployee = 0;

        for (const user of teacherUsers) {
            if (!user.email) continue;

            const employee = await prisma.employee.findFirst({
                where: {
                    email: user.email,
                    role: 'TEACHER'
                }
            });

            if (!employee) {
                console.log(`⚠️  Usuario TEACHER sin empleado: ${user.name} (${user.email})`);
                usersWithoutEmployee++;
            }
        }

        if (usersWithoutEmployee === 0) {
            console.log('✓ Todos los usuarios TEACHER tienen un empleado correspondiente');
        } else {
            console.log(`\n⚠️  ${usersWithoutEmployee} usuarios TEACHER no tienen empleado correspondiente`);
        }

    } catch (error) {
        console.error('❌ Error durante la sincronización:', error);
    } finally {
        await prisma.$disconnect();
    }
}

syncEmployeesToUsers()
    .then(() => {
        console.log('\n✅ Sincronización completada');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
