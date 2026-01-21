import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateNextPaymentDate, extractClassDays } from "@/lib/payment-utils";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const businessId = session.user.businessId!;
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId");

        // Fetch business settings for payment mode and enrollment fee
        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: {
                paymentMode: true,
                defaultPaymentDay: true,
                paymentGraceDays: true,
                enrollmentFee: true,
                enrollmentFeeMode: true,
            }
        });

        const paymentMode = (business?.paymentMode || "FIXED_DAY") as "FIXED_DAY" | "ENROLLMENT_DATE";
        const defaultPaymentDay = business?.defaultPaymentDay ?? 1;
        const graceDays = business?.paymentGraceDays ?? 5;
        const globalEnrollmentFee = business?.enrollmentFee ?? 0;
        const enrollmentFeeMode = (business?.enrollmentFeeMode || "CALENDAR_YEAR") as "CALENDAR_YEAR" | "EVERY_12_MONTHS";

        const where: any = {
            businessId,
        };

        if (branchId) {
            where.OR = [
                { branches: { some: { id: branchId } } },
                { branches: { none: {} } }
            ];
        }

        // Get all students with their scholarships, fees, and schedule enrollments
        const students = await prisma.student.findMany({
            where,
            include: {
                scholarships: {
                    where: { active: true },
                    select: {
                        id: true,
                        name: true,
                        percentage: true,
                        amount: true,
                        courseId: true,   // null = applies to all courses
                        scheduleId: true  // null = applies to all groups
                    }
                },
                fees: {
                    where: {
                        status: { not: "CANCELLED" }
                    },
                    include: {
                        payments: true,
                    },
                },
                branches: true,
                scheduleEnrollments: {
                    where: { status: "ACTIVE" },
                    include: {
                        schedule: {
                            select: {
                                dayOfWeek: true,
                                courseId: true,
                                course: {
                                    select: {
                                        id: true,
                                        name: true,
                                        price: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: [
                { lastName: "asc" },
                { firstName: "asc" },
            ],
        });

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Calculate balance and payment info for each student
        const studentsWithBalance = [];
        for (const student of students) {
            let totalDebt = 0;
            let overdueCount = 0;

            student.fees.forEach((fee) => {
                const paid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
                const remaining = fee.amount - paid;

                if (remaining > 0) {
                    totalDebt += remaining;
                    if (new Date(fee.dueDate) < now) {
                        overdueCount += 1;
                    }
                }
            });

            // Calculate next payment date
            // PRIORITY: 1) Manual Student.enrollmentDate, 2) Earliest group enrollment, 3) createdAt
            // This allows users to override the automatic enrollment date
            const earliestGroupEnrollment = student.scheduleEnrollments.length > 0
                ? student.scheduleEnrollments
                    .map(e => new Date(e.enrolledAt))
                    .sort((a, b) => a.getTime() - b.getTime())[0]
                : null;

            // Manual date takes priority if set
            const effectiveEnrollmentDate = student.enrollmentDate
                ? new Date(student.enrollmentDate)
                : (earliestGroupEnrollment || student.createdAt);

            const classDays = extractClassDays(student.scheduleEnrollments.map(e => e.schedule));

            const nextPaymentDate = calculateNextPaymentDate(
                effectiveEnrollmentDate,
                paymentMode,
                defaultPaymentDay,
                classDays
            );

            // Calculate days until payment
            const nextPaymentNormalized = new Date(nextPaymentDate.getFullYear(), nextPaymentDate.getMonth(), nextPaymentDate.getDate());
            const daysUntilPayment = Math.ceil((nextPaymentNormalized.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Determine payment status based on DATE (not just debt)
            // The badge should show upcoming payment regardless of whether fees exist
            // BUT only for students who are actually enrolled in a class
            let paymentStatus: "PAID" | "UPCOMING" | "DUE_SOON" | "OVERDUE" = "UPCOMING";

            // Only calculate payment status if student is enrolled in at least one class
            const isEnrolled = student.scheduleEnrollments.length > 0;

            if (!isEnrolled) {
                // Not enrolled in any class - no payment warning needed
                paymentStatus = "UPCOMING";
            } else if (daysUntilPayment < -graceDays) {
                // Past due date + grace days
                paymentStatus = "OVERDUE";
            } else if (daysUntilPayment <= 5 && daysUntilPayment >= -graceDays) {
                // Within 5 days before or in grace period
                paymentStatus = "DUE_SOON";
            } else if (totalDebt === 0 && daysUntilPayment > 5) {
                // Only PAID if no debt AND payment date is far away
                paymentStatus = "PAID";
            }

            // === AUTO FEE GENERATION ===
            // If student is enrolled, payment is due, but no fee exists for this month
            if (isEnrolled && (paymentStatus === "DUE_SOON" || paymentStatus === "OVERDUE")) {
                // Check if fee already exists for this payment period
                const paymentMonth = nextPaymentDate.getMonth();
                const paymentYear = nextPaymentDate.getFullYear();

                console.log(`[AUTO FEE] Checking ${student.firstName}: month=${paymentMonth}, year=${paymentYear}`);
                console.log(`[AUTO FEE] Existing fees:`, (student as any).fees.length);

                const existingFee = (student as any).fees.find((fee: any) => {
                    const feeDate = new Date(fee.dueDate);
                    return feeDate.getMonth() === paymentMonth && feeDate.getFullYear() === paymentYear;
                });

                console.log(`[AUTO FEE] Existing fee for this month:`, existingFee ? 'YES' : 'NO');

                if (!existingFee) {
                    // Get unique COURSES from enrollments (not individual schedules)
                    // A group like "Algebra A" may have 3 schedules (Mon/Wed/Fri) but should create only 1 fee
                    const courses = new Map<string, { courseId: string; courseName: string; price: number; scheduleIds: string[] }>();
                    (student as any).scheduleEnrollments.forEach((enrollment: any) => {
                        const schedule = enrollment.schedule;
                        const course = schedule?.course;
                        console.log(`[AUTO FEE] Enrollment: scheduleId=${enrollment.scheduleId}, course=`, course);
                        if (course && course.id) {
                            if (!courses.has(course.id)) {
                                courses.set(course.id, {
                                    courseId: course.id,
                                    courseName: course.name,
                                    price: course.price || 0,
                                    scheduleIds: [enrollment.scheduleId]
                                });
                            } else {
                                // Add scheduleId to existing course entry
                                courses.get(course.id)!.scheduleIds.push(enrollment.scheduleId);
                            }
                        }
                    });

                    console.log(`[AUTO FEE] Unique courses found:`, courses.size);

                    // Create fee for each COURSE (not per schedule)
                    for (const [courseId, course] of courses) {
                        if (course.price <= 0) continue;

                        // Find applicable scholarships:
                        // 1. Global (scheduleId=null AND courseId=null)
                        // 2. For any schedule in this course (scheduleId matches any in scheduleIds)
                        // 3. For this course (courseId matches, scheduleId=null)
                        const applicableScholarships = (student as any).scholarships.filter((s: any) => {
                            const isGlobal = s.scheduleId === null && s.courseId === null;
                            const isForAnySchedule = course.scheduleIds.includes(s.scheduleId);
                            const isForThisCourse = s.courseId === courseId && s.scheduleId === null;
                            return isGlobal || isForAnySchedule || isForThisCourse;
                        });

                        // Calculate discount
                        let discount = 0;
                        for (const scholarship of applicableScholarships) {
                            if (scholarship.percentage) {
                                discount += (course.price * scholarship.percentage) / 100;
                            } else if (scholarship.amount) {
                                discount += scholarship.amount;
                            }
                        }

                        const finalAmount = Math.max(0, course.price - discount);

                        // DEBUG: Log scholarship calculation
                        if (applicableScholarships.length > 0) {
                            console.log(`[SCHOLARSHIP CALC] ${student.firstName}: ${course.courseName}`);
                            console.log(`  Price: ${course.price}, Scholarships: ${applicableScholarships.length}`);
                            applicableScholarships.forEach((s: any) => console.log(`    - ${s.name}: ${s.percentage}% / $${s.amount}`));
                            console.log(`  Discount: ${discount}, Final: ${finalAmount}`);
                        }

                        // Create the fee with auto-calculated teacher commission
                        try {
                            // Find the teacher for this course's group (from first schedule)
                            let expectedTeacherId: string | null = null;
                            let expectedCommission: number | null = null;

                            const firstScheduleId = course.scheduleIds[0];
                            if (firstScheduleId) {
                                const scheduleWithTeacher = await prisma.classSchedule.findUnique({
                                    where: { id: firstScheduleId },
                                    include: {
                                        teacher: true  // Now Employee directly
                                    }
                                });

                                // schedule.teacher is now Employee directly
                                const teacher = scheduleWithTeacher?.teacher;
                                if (teacher && (teacher.paymentModel === 'COMMISSION' || teacher.paymentModel === 'MIXED')) {
                                    expectedTeacherId = teacher.id;
                                    const pct = teacher.commissionPercentage || 0;
                                    expectedCommission = finalAmount * (pct / 100);
                                    console.log(`[AUTO FEE] Teacher: ${teacher.firstName}, Commission: ${expectedCommission} (${pct}%)`);
                                }
                            }

                            await prisma.studentFee.create({
                                data: {
                                    title: `${course.courseName} - ${nextPaymentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`,
                                    amount: finalAmount,
                                    originalAmount: course.price,
                                    discountApplied: discount,
                                    dueDate: nextPaymentDate,
                                    status: paymentStatus === "OVERDUE" ? "OVERDUE" : "PENDING",
                                    studentId: student.id,
                                    courseId: course.courseId,
                                    expectedTeacherId,
                                    expectedCommission
                                }
                            });
                            totalDebt += finalAmount; // Update total for UI
                        } catch (e) {
                            console.error("Error creating auto fee:", e);
                        }
                    }
                }
            }

            // === AUTO ENROLLMENT FEE GENERATION ===
            if (isEnrolled && globalEnrollmentFee > 0) {
                const studentEnrollmentFee = (student as any).enrollmentFeeOverride ?? globalEnrollmentFee;
                const lastEnrollmentFeeDate = (student as any).lastEnrollmentFeeDate ? new Date((student as any).lastEnrollmentFeeDate) : null;
                const studentEnrollmentDate = new Date(student.enrollmentDate);

                let needsEnrollmentFee = false;
                let enrollmentFeeReason = "";

                if (!lastEnrollmentFeeDate) {
                    // First time: charge enrollment fee
                    needsEnrollmentFee = true;
                    enrollmentFeeReason = "Primera inscripción";
                } else if (enrollmentFeeMode === "CALENDAR_YEAR") {
                    // Check if we're in a new year and haven't charged yet this year
                    const currentYear = now.getFullYear();
                    const lastFeeYear = lastEnrollmentFeeDate.getFullYear();
                    if (currentYear > lastFeeYear) {
                        needsEnrollmentFee = true;
                        enrollmentFeeReason = `Inscripción ${currentYear}`;
                    }
                } else if (enrollmentFeeMode === "EVERY_12_MONTHS") {
                    // Check if 12 months have passed since last enrollment fee
                    const monthsSinceLastFee = (now.getFullYear() - lastEnrollmentFeeDate.getFullYear()) * 12 +
                        (now.getMonth() - lastEnrollmentFeeDate.getMonth());
                    if (monthsSinceLastFee >= 12) {
                        needsEnrollmentFee = true;
                        enrollmentFeeReason = "Renovación anual";
                    }
                }

                if (needsEnrollmentFee && studentEnrollmentFee > 0) {
                    // Check if enrollment fee already exists for this year
                    const existingEnrollmentFee = (student as any).fees.find((fee: any) =>
                        fee.title.toLowerCase().includes("inscripción") &&
                        new Date(fee.dueDate).getFullYear() === now.getFullYear()
                    );

                    if (!existingEnrollmentFee) {
                        try {
                            await prisma.studentFee.create({
                                data: {
                                    title: `Inscripción - ${enrollmentFeeReason}`,
                                    amount: studentEnrollmentFee,
                                    originalAmount: studentEnrollmentFee,
                                    discountApplied: 0,
                                    dueDate: now,
                                    status: "PENDING",
                                    studentId: student.id,
                                }
                            });

                            // Update lastEnrollmentFeeDate
                            await prisma.student.update({
                                where: { id: student.id },
                                data: { lastEnrollmentFeeDate: now }
                            });

                            totalDebt += studentEnrollmentFee;
                            console.log(`[ENROLLMENT FEE] Created for ${student.firstName}: $${studentEnrollmentFee}`);
                        } catch (e) {
                            console.error("Error creating enrollment fee:", e);
                        }
                    }
                }
            }

            // DEBUG: Log calculation for first few students
            if (student.firstName === "Sophia" || student.lastName.includes("Arellano")) {
                console.log(`[PAYMENT DEBUG] Student: ${student.firstName} ${student.lastName}`);
                console.log(`  enrollmentDate: ${effectiveEnrollmentDate}`);
                console.log(`  nextPaymentDate: ${nextPaymentDate}`);
                console.log(`  daysUntilPayment: ${daysUntilPayment}`);
                console.log(`  paymentStatus: ${paymentStatus}`);
                console.log(`  graceDays: ${graceDays}`);
            }

            studentsWithBalance.push({
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                matricula: student.matricula,
                email: student.email,
                phone: student.phone,
                address: student.address,
                guardianName: (student as any).guardianName,
                guardianPhone: (student as any).guardianPhone,
                status: student.status,
                hasScholarship: (student as any).scholarships.length > 0,
                scholarshipCount: (student as any).scholarships.length,
                totalDebt,
                balance: totalDebt,
                branches: (student as any).branches,
                overdueCount,
                // Payment fields
                nextPaymentDate: nextPaymentDate.toISOString(),
                daysUntilPayment,
                paymentStatus,
                // Enrollment data for edit modal
                enrollmentDate: student.enrollmentDate?.toISOString() || null,
                enrollments: (student as any).scheduleEnrollments.map((e: any) => ({
                    scheduleId: e.scheduleId,
                    enrolledAt: e.enrolledAt
                })),
                // Scholarships for inline editing
                scholarships: (student as any).scholarships.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    percentage: s.percentage,
                    amount: s.amount,
                    scheduleId: s.scheduleId
                })),
            });
        }

        return NextResponse.json(studentsWithBalance);
    } catch (error) {
        console.error("[STUDENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
