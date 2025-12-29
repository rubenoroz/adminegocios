import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Get sales for the last 30 days
        const endDate = new Date();
        const startDate = subMonths(endDate, 1);

        const sales = await prisma.sale.findMany({
            where: {
                branch: { businessId: user.businessId },
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: "COMPLETED"
            }
        });

        // Group by day
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const chartData = days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const daySales = sales.filter(sale => format(sale.createdAt, 'yyyy-MM-dd') === dayStr);
            const total = daySales.reduce((acc, sale) => acc + sale.total, 0);
            return {
                date: format(day, 'd MMM', { locale: es }),
                total
            };
        });

        return NextResponse.json(chartData);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
