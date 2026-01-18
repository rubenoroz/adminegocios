import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de limpieza de cargos por NEGOCIO
 * 
 * Uso: npx tsx cleanup_all_fees.ts <businessId>
 * 
 * Este script está diseñado para multi-tenancy: solo afecta al negocio especificado.
 */
async function cleanupAllFees() {
    const businessId = process.argv[2];

    if (!businessId) {
        // Listar negocios disponibles para que el usuario elija
        const businesses = await prisma.business.findMany({
            select: { id: true, name: true }
        });
        console.log('❌ Debes especificar un businessId.\n');
        console.log('Negocios disponibles:');
        businesses.forEach(b => {
            console.log(`  - ${b.name}: ${b.id}`);
        });
        console.log('\nUso: npx tsx cleanup_all_fees.ts <businessId>');
        return;
    }

    // Verificar que el negocio existe
    const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, name: true }
    });

    if (!business) {
        console.log(`❌ No se encontró el negocio con ID: ${businessId}`);
        return;
    }

    console.log(`🧹 Iniciando limpieza para: ${business.name}\n`);

    // Obtener los IDs de estudiantes de este negocio
    const students = await prisma.student.findMany({
        where: { businessId },
        select: { id: true }
    });
    const studentIds = students.map(s => s.id);

    // 1. Primero eliminar todos los pagos de estudiantes del negocio
    const paymentsDeleted = await prisma.studentPayment.deleteMany({
        where: {
            studentFee: {
                student: { businessId }
            }
        }
    });
    console.log(`✅ ${paymentsDeleted.count} pagos de estudiantes eliminados`);

    // 2. Eliminar todos los cargos (StudentFee) del negocio
    const feesDeleted = await prisma.studentFee.deleteMany({
        where: {
            student: { businessId }
        }
    });
    console.log(`✅ ${feesDeleted.count} cargos de estudiantes eliminados`);

    // 3. Eliminar todas las inscripciones a horarios (ScheduleEnrollment) del negocio
    const scheduleEnrollmentsDeleted = await prisma.scheduleEnrollment.deleteMany({
        where: {
            studentId: { in: studentIds }
        }
    });
    console.log(`✅ ${scheduleEnrollmentsDeleted.count} inscripciones a horarios/grupos eliminadas`);

    // 4. Eliminar todas las inscripciones a cursos (Enrollment) del negocio
    const enrollmentsDeleted = await prisma.enrollment.deleteMany({
        where: {
            studentId: { in: studentIds }
        }
    });
    console.log(`✅ ${enrollmentsDeleted.count} inscripciones a cursos eliminadas`);

    // 5. Eliminar todas las becas (Scholarship) del negocio
    const scholarshipsDeleted = await prisma.scholarship.deleteMany({
        where: {
            studentId: { in: studentIds }
        }
    });
    console.log(`✅ ${scholarshipsDeleted.count} becas eliminadas`);

    // 6. Eliminar todos los pagos programados de estudiantes del negocio
    const scheduledPaymentsDeleted = await prisma.scheduledPayment.deleteMany({
        where: {
            businessId,
            type: 'STUDENT_FEE'
        }
    });
    console.log(`✅ ${scheduledPaymentsDeleted.count} pagos programados eliminados`);

    // 7. Resetear lastEnrollmentFeeDate para que se regeneren los cargos de inscripción
    const enrollmentDatesReset = await prisma.student.updateMany({
        where: {
            businessId,
            lastEnrollmentFeeDate: { not: null }
        },
        data: {
            lastEnrollmentFeeDate: null
        }
    });
    console.log(`✅ ${enrollmentDatesReset.count} fechas de inscripción reseteadas`);

    console.log(`\n✅ ¡Limpieza completa para ${business.name}!`);
    console.log('📌 Los alumnos de este negocio ahora no tienen cargos ni inscripciones.');
    console.log('📌 Puedes crear nuevos grupos e inscripciones desde cero.');
    console.log('📌 Los cargos de mensualidad e inscripción se regenerarán automáticamente al cargar la lista de estudiantes.');
}

cleanupAllFees()
    .catch((error) => {
        console.error('❌ Error durante la limpieza:', error);
    })
    .finally(() => prisma.$disconnect());
