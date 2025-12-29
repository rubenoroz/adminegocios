/**
 * Script para sincronizar empleados con rol TEACHER a la tabla User
 * Esto asegura que todos los profesores puedan ser asignados a cursos
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function syncTeachersToUsers() {
    try {
        console.log('🔍 Buscando empleados con rol TEACHER...');

        // Obtener todos los empleados con rol TEACHER
        const teachers = await prisma.employee.findMany({
            where: {
                role: 'TEACHER'
            }
        });

        console.log(`✅ Encontrados ${teachers.length} profesores en la tabla Employee`);

        let created = 0;
        let existing = 0;

        for (const teacher of teachers) {
            if (!teacher.email) {
                console.log(`⚠️  Profesor ${teacher.firstName} ${teacher.lastName} no tiene email, omitiendo...`);
                continue;
            }

            // Verificar si ya existe un usuario con ese email
            const existingUser = await prisma.user.findUnique({
                where: { email: teacher.email }
            });

            if (existingUser) {
                console.log(`ℹ️  Usuario ya existe para: ${teacher.email}`);
                existing++;

                // Verificar si el usuario tiene el rol correcto
                if (existingUser.role !== 'TEACHER') {
                    console.log(`   ⚠️  Actualizando rol de ${existingUser.role} a TEACHER`);
                    await prisma.user.update({
                        where: { id: existingUser.id },
                        data: { role: 'TEACHER' }
                    });
                }
            } else {
                // Crear usuario para el profesor
                const hashedPassword = await bcrypt.hash('password123', 10);

                await prisma.user.create({
                    data: {
                        name: `${teacher.firstName} ${teacher.lastName}`,
                        email: teacher.email,
                        password: hashedPassword,
                        role: 'TEACHER',
                        businessId: teacher.businessId,
                        branchId: teacher.branchId,
                        status: 'ACTIVE'
                    }
                });

                console.log(`✅ Usuario creado para: ${teacher.email}`);
                created++;
            }
        }

        console.log('\n📊 Resumen:');
        console.log(`   - Usuarios existentes: ${existing}`);
        console.log(`   - Usuarios creados: ${created}`);
        console.log(`   - Total profesores: ${teachers.length}`);

        // Verificar usuarios con rol TEACHER
        const teacherUsers = await prisma.user.findMany({
            where: { role: 'TEACHER' },
            select: {
                id: true,
                name: true,
                email: true,
                businessId: true
            }
        });

        console.log(`\n✅ Total de usuarios con rol TEACHER: ${teacherUsers.length}`);
        teacherUsers.forEach(user => {
            console.log(`   - ${user.name} (${user.email})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

syncTeachersToUsers()
    .then(() => {
        console.log('\n✅ Sincronización completada exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error en la sincronización:', error);
        process.exit(1);
    });
