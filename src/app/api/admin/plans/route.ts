import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/plans - Listar todos los planes
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        // Solo SUPERADMIN puede acceder
        if (user?.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const plans = await prisma.plan.findMany({
            orderBy: { price: "asc" },
            include: {
                _count: {
                    select: { businesses: true }
                }
            }
        });

        return NextResponse.json(plans);
    } catch (error) {
        console.error("Error fetching plans:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST /api/admin/plans - Crear nuevo plan
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        // Solo SUPERADMIN puede crear planes
        if (user?.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { name, price, interval, maxCourses, maxTeachers, maxStudents, maxBranches, maxInventoryItems, description, features } = body;

        if (!name || price === undefined) {
            return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
        }

        const plan = await prisma.plan.create({
            data: {
                name,
                price: parseFloat(price),
                interval: interval || "monthly",
                maxCourses: maxCourses ? parseInt(maxCourses) : null,
                maxTeachers: maxTeachers ? parseInt(maxTeachers) : null,
                maxStudents: maxStudents ? parseInt(maxStudents) : null,
                maxBranches: maxBranches ? parseInt(maxBranches) : null,
                maxInventoryItems: maxInventoryItems ? parseInt(maxInventoryItems) : null,
                description: description || "",
                features: features || ""
            }
        });

        return NextResponse.json(plan);
    } catch (error) {
        console.error("Error creating plan:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
