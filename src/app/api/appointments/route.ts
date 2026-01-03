import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/appointments - List appointments with filters
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

        const { searchParams } = new URL(req.url);
        const date = searchParams.get("date");
        const status = searchParams.get("status");
        const employeeId = searchParams.get("employeeId");
        const customerId = searchParams.get("customerId");

        // Build where clause
        const where: any = {};

        // Filter by service's business
        where.service = { businessId: user.businessId };

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            where.startTime = { gte: startOfDay, lte: endOfDay };
        }

        if (status) {
            where.status = status;
        }

        if (employeeId) {
            where.employeeId = employeeId;
        }

        if (customerId) {
            where.customerId = customerId;
        }

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                service: { select: { name: true, duration: true, price: true, color: true } },
                customer: { select: { id: true, name: true, phone: true, email: true } },
                employee: { select: { id: true, firstName: true, lastName: true } }
            },
            orderBy: { startTime: 'asc' }
        });

        return NextResponse.json(appointments);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST /api/appointments - Create a new appointment
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { serviceId, customerId, employeeId, startTime, notes } = body;

        if (!serviceId || !customerId || !startTime) {
            return NextResponse.json({ error: "Service, customer, and start time are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user?.businessId) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Get branchId
        const branchId = user.branchId || (await prisma.branch.findFirst({ where: { businessId: user.businessId } }))?.id;
        if (!branchId) {
            return NextResponse.json({ error: "Branch not found" }, { status: 404 });
        }

        // Get service to calculate end time
        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }

        const startDate = new Date(startTime);
        const endDate = new Date(startDate.getTime() + service.duration * 60000);

        const appointment = await prisma.appointment.create({
            data: {
                startTime: startDate,
                endTime: endDate,
                notes,
                serviceId,
                customerId,
                employeeId: employeeId || null,
                branchId
            },
            include: {
                service: { select: { name: true, duration: true, price: true, color: true } },
                customer: { select: { name: true, phone: true } },
                employee: { select: { firstName: true, lastName: true } }
            }
        });

        return NextResponse.json(appointment);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
