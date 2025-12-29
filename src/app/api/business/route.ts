import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, type, colors } = body;

        if (!name || !type) {
            return NextResponse.json({ error: "Missing name or type" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create Business
        const business = await prisma.business.create({
            data: {
                name,
                type,
                primaryColor: colors?.primary || "#3b82f6",
                sidebarColor: colors?.sidebar || "#0f172a",
                users: {
                    connect: { id: user.id }
                },
                branches: {
                    create: {
                        name: "Matriz",
                        address: "Dirección principal"
                    }
                }
            }
        });

        // Update User with Business ID and Role
        await prisma.user.update({
            where: { id: user.id },
            data: {
                businessId: business.id,
                role: "OWNER"
            }
        });

        return NextResponse.json(business);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
