import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const branches = await prisma.branch.findMany({
            where: {
                businessId: session.user.businessId
            },
            include: {
                business: true
            }
        });

        return NextResponse.json(branches);
    } catch (error) {
        console.error("[BRANCHES_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.businessId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, address } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const branch = await prisma.branch.create({
            data: {
                name,
                address,
                businessId: session.user.businessId
            }
        });

        return NextResponse.json(branch);
    } catch (error) {
        console.error("[BRANCHES_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
