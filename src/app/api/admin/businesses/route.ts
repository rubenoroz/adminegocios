import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/businesses - Listar todos los negocios
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

        const businesses = await prisma.business.findMany({
            include: {
                plan: true,
                _count: {
                    select: {
                        users: true,
                        branches: true,
                        courses: true,
                        students: true,
                        employees: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(businesses);
    } catch (error) {
        console.error("Error fetching businesses:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST /api/admin/businesses - Crear nuevo negocio
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        // Solo SUPERADMIN puede crear negocios
        if (user?.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { name, type, planId, ownerEmail, ownerPassword } = body;

        if (!name || !type || !ownerEmail || !ownerPassword) {
            return NextResponse.json(
                { error: "Name, type, ownerEmail and ownerPassword are required" },
                { status: 400 }
            );
        }

        // Verificar que el plan existe
        if (planId) {
            const plan = await prisma.plan.findUnique({ where: { id: planId } });
            if (!plan) {
                return NextResponse.json({ error: "Plan not found" }, { status: 404 });
            }
        }

        // Crear negocio y owner en transacción
        const result = await prisma.$transaction(async (tx) => {
            // Crear negocio
            const business = await tx.business.create({
                data: {
                    name,
                    type,
                    planId: planId || "free"
                }
            });

            // Crear primer sucursal
            const branch = await tx.branch.create({
                data: {
                    name: "Principal",
                    businessId: business.id
                }
            });

            // Crear usuario owner
            const bcrypt = require("bcryptjs");
            const hashedPassword = await bcrypt.hash(ownerPassword, 10);

            const owner = await tx.user.create({
                data: {
                    email: ownerEmail,
                    password: hashedPassword,
                    name,
                    role: "OWNER",
                    businessId: business.id,
                    branchId: branch.id
                }
            });

            return { business, owner, branch };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error creating business:", error);
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Email already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
