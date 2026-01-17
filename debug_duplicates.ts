
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
    try {
        const id1 = 'cmkidp24p000h6zzkhj4n3vxk'; // Paid, Unlinked
        const id2 = 'cmkidp2fv000j6zzkxyy2a5r1'; // Pending, Linked

        const f1 = await prisma.studentFee.findUnique({ where: { id: id1 }, include: { student: true, course: true } });
        const f2 = await prisma.studentFee.findUnique({ where: { id: id2 }, include: { student: true, course: true } });

        console.log("--- FEE 1 (PAID) ---");
        console.log(`ID: ${f1?.id}`);
        console.log(`Student: ${f1?.student?.name} (${f1?.studentId})`);
        console.log(`Course: ${f1?.course?.name} (${f1?.courseId})`);
        console.log(`Amount: ${f1?.amount}`);
        console.log(`Status: ${f1?.status}`);
        console.log(`Teacher: ${f1?.expectedTeacherId}`);

        console.log("\n--- FEE 2 (PENDING) ---");
        console.log(`ID: ${f2?.id}`);
        console.log(`Student: ${f2?.student?.name} (${f2?.studentId})`);
        console.log(`Course: ${f2?.course?.name} (${f2?.courseId})`);
        console.log(`Amount: ${f2?.amount}`);
        console.log(`Status: ${f2?.status}`);
        console.log(`Teacher: ${f2?.expectedTeacherId}`);

        if (f1?.studentId === f2?.studentId && f1?.courseId === f2?.courseId) {
            console.log("\n✅ DUPLICATES CONFIRMED: Same Student, Same Course.");
        } else {
            console.log("\n❌ NOT Duplicates.");
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDuplicates();
