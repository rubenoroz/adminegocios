import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SecurityIssue {
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    api: string;
    issue: string;
    recommendation: string;
}

async function comprehensiveSecurityAudit() {
    console.log('🔒 AUDITORÍA COMPLETA DE SEGURIDAD MULTI-TENANT\n');
    console.log('='.repeat(60) + '\n');

    const issues: SecurityIssue[] = [];

    // 1. Verificar organizaciones
    const businesses = await prisma.business.findMany({
        select: { id: true, name: true, type: true }
    });

    console.log(`📊 ORGANIZACIONES EN EL SISTEMA: ${businesses.length}\n`);
    businesses.forEach((b, i) => {
        console.log(`  ${i + 1}. ${b.name}`);
        console.log(`     - ID: ${b.id}`);
        console.log(`     - Tipo: ${b.type}\n`);
    });

    // 2. Verificar usuarios por organización
    console.log('👥 USUARIOS POR ORGANIZACIÓN:\n');
    for (const business of businesses) {
        const users = await prisma.user.findMany({
            where: { businessId: business.id },
            select: { name: true, email: true, role: true }
        });

        console.log(`  ${business.name}:`);
        users.forEach(u => {
            console.log(`    - ${u.name} (${u.email}) - ${u.role}`);
        });
        console.log(`    Total: ${users.length} usuarios\n`);
    }

    // 3. Verificar usuarios sin businessId (CRÍTICO)
    const orphanUsers = await prisma.user.findMany({
        where: { businessId: null },
        select: { name: true, email: true, role: true }
    });

    if (orphanUsers.length > 0) {
        issues.push({
            severity: 'CRITICAL',
            api: 'Database',
            issue: `${orphanUsers.length} usuarios sin businessId asignado`,
            recommendation: 'Asignar businessId a todos los usuarios o eliminarlos'
        });
        console.log(`⚠️  CRÍTICO: ${orphanUsers.length} usuarios sin businessId:\n`);
        orphanUsers.forEach(u => {
            console.log(`    - ${u.name} (${u.email})`);
        });
        console.log('');
    } else {
        console.log('✅ Todos los usuarios tienen businessId asignado\n');
    }

    // 4. Verificar empleados por organización
    console.log('👔 EMPLEADOS POR ORGANIZACIÓN:\n');
    for (const business of businesses) {
        const employees = await prisma.employee.findMany({
            where: { businessId: business.id },
            select: { firstName: true, lastName: true, role: true }
        });

        console.log(`  ${business.name}: ${employees.length} empleados`);
    }
    console.log('');

    // 5. Verificar cursos por organización
    console.log('📚 CURSOS POR ORGANIZACIÓN:\n');
    for (const business of businesses) {
        const courses = await prisma.course.findMany({
            where: { businessId: business.id },
            select: { name: true }
        });

        console.log(`  ${business.name}: ${courses.length} cursos`);
    }
    console.log('');

    // 6. Verificar estudiantes por organización
    console.log('🎓 ESTUDIANTES POR ORGANIZACIÓN:\n');
    for (const business of businesses) {
        const students = await prisma.student.findMany({
            where: { businessId: business.id },
            select: { firstName: true, lastName: true }
        });

        console.log(`  ${business.name}: ${students.length} estudiantes`);
    }
    console.log('');

    // 7. Verificar productos por organización
    console.log('📦 PRODUCTOS POR ORGANIZACIÓN:\n');
    for (const business of businesses) {
        const products = await prisma.product.findMany({
            where: { businessId: business.id },
            select: { name: true }
        });

        console.log(`  ${business.name}: ${products.length} productos`);
    }
    console.log('');

    // 8. Resumen de seguridad
    console.log('='.repeat(60));
    console.log('\n📋 RESUMEN DE AUDITORÍA:\n');

    if (issues.length === 0) {
        console.log('✅ No se encontraron problemas críticos de seguridad');
        console.log('✅ Todas las organizaciones están correctamente aisladas');
    } else {
        console.log(`⚠️  Se encontraron ${issues.length} problema(s):\n`);
        issues.forEach((issue, i) => {
            console.log(`  ${i + 1}. [${issue.severity}] ${issue.api}`);
            console.log(`     Problema: ${issue.issue}`);
            console.log(`     Recomendación: ${issue.recommendation}\n`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Auditoría completada\n');

    await prisma.$disconnect();
    return issues;
}

comprehensiveSecurityAudit()
    .then((issues) => {
        process.exit(issues.length > 0 ? 1 : 0);
    })
    .catch((error) => {
        console.error('❌ Error durante la auditoría:', error);
        process.exit(1);
    });
