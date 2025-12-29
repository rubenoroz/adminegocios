import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Only OWNER and ADMIN can create users
        if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { name, email, password, role, branchId } = body;

        if (!name || !email || !password || !role) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "El email ya está registrado" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                businessId: session.user.businessId!,
                branchId: branchId || null,
            },
        });

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.error("[USERS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role");
        const roles = role ? role.split(",") : [];

        // Allow any authenticated user to view teachers
        // But only OWNER and ADMIN can view all users or other roles
        const isRequestingTeachers = roles.length === 1 && roles[0] === "TEACHER";

        if (!isRequestingTeachers && session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const users = await prisma.user.findMany({
            where: {
                businessId: session.user.businessId!,
                ...(roles.length > 0 ? { role: { in: roles } } : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                branchId: true,
                branch: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("[USERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
