import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, eachDayOfInterval, getDay, format } from "date-fns";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");
        const startDateStr = searchParams.get("startDate");
        const endDateStr = searchParams.get("endDate");

        if (!businessId || !startDateStr || !endDateStr) {
            return new NextResponse("Missing required parameters", { status: 400 });
        }

        const startDate = startOfDay(new Date(startDateStr));
        const endDate = endOfDay(new Date(endDateStr));

        // 1. Fetch all teachers with hourly rate
        const teachers = await prisma.user.findMany({
            where: {
                businessId,
                role: "TEACHER"
            },
            select: {
                id: true,
                name: true,
                email: true,
                hourlyRate: true
            }
        });

        // 2. Fetch all class schedules
        const schedules = await prisma.classSchedule.findMany({
            where: { businessId },
            include: {
                course: true
            }
        });

        // 3. Fetch business settings for reserve percentages
        const business = await prisma.business.findUnique({
            where: { id: businessId }
        }) as any;

        // 4. Calculate hours for each teacher
        const payrollData = await Promise.all(teachers.map(async (teacher) => {
            let totalHours = 0;
            let totalClasses = 0;
            const details: any[] = [];

            // Filter schedules relevant to this teacher
            const teacherSchedules = schedules.filter((s: any) =>
                s.teacherId === teacher.id ||
                (!s.teacherId && s.course.teacherId === teacher.id)
            );

            // Iterate through each day in the range
            const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });

            daysInterval.forEach(day => {
                const dayOfWeek = getDay(day); // 0-6 (Sun-Sat)

                // Find schedules for this day of week
                const dailySchedules = teacherSchedules.filter((s: any) => s.dayOfWeek === dayOfWeek);

                dailySchedules.forEach((schedule: any) => {
                    // Calculate duration
                    const [startH, startM] = schedule.startTime.split(':').map(Number);
                    const [endH, endM] = schedule.endTime.split(':').map(Number);
                    const durationHours = (endH + endM / 60) - (startH + startM / 60);

                    totalHours += durationHours;
                    totalClasses++;

                    details.push({
                        date: format(day, 'yyyy-MM-dd'),
                        course: schedule.course.name,
                        hours: durationHours.toFixed(2),
                        time: `${schedule.startTime}-${schedule.endTime}`
                    });
                });
            });

            // Calculate Pay
            let totalPay = 0;
            let grossPay = 0;
            let reserves = { expenses: 0, benefits: 0 };

            // Check if teacher has commission model (if the field exists)
            const teacherAny = teacher as any;
            if (teacherAny.paymentModel === "COMMISSION") {
                const commissionRate = teacherAny.commissionPercentage || 0;

                // Get fees paid in this period for courses taught by this teacher
                const paidFees = await prisma.studentFee.aggregate({
                    where: {
                        status: "PAID",
                        updatedAt: { gte: startDate, lte: endDate },
                        course: { teacherId: teacher.id }
                    },
                    _sum: { amount: true }
                });

                const totalRevenue = paidFees._sum.amount || 0;
                grossPay = totalRevenue * (commissionRate / 100);

                const expenseReserveRate = business?.expenseReservePercentage || 0;
                const benefitsReserveRate = business?.benefitsReservePercentage || 0;

                reserves.expenses = grossPay * (expenseReserveRate / 100);
                reserves.benefits = grossPay * (benefitsReserveRate / 100);

                totalPay = grossPay - reserves.expenses - reserves.benefits;

            } else {
                // HOURLY (default)
                grossPay = totalHours * ((teacher as any).hourlyRate || 0);
                totalPay = grossPay;
            }

            return {
                teacherId: teacher.id,
                name: teacher.name || teacher.email,
                paymentModel: teacherAny.paymentModel || "HOURLY",
                hourlyRate: (teacher as any).hourlyRate || 0,
                commissionPercentage: teacherAny.commissionPercentage || 0,
                totalHours: parseFloat(totalHours.toFixed(2)),
                totalClasses,
                grossPay: parseFloat(grossPay.toFixed(2)),
                reserves: {
                    expenses: parseFloat(reserves.expenses.toFixed(2)),
                    benefits: parseFloat(reserves.benefits.toFixed(2))
                },
                totalPay: parseFloat(totalPay.toFixed(2)),
                details
            };
        }));

        return NextResponse.json(payrollData);
    } catch (error) {
        console.error("[PAYROLL_API]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
