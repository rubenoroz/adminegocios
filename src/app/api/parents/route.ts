import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// GET - List all parent accounts
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");

        if (!businessId) {
            return new NextResponse("Missing businessId", { status: 400 });
        }

        const parents = await prisma.parentAccount.findMany({
            where: { businessId },
            include: {
                students: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                matricula: true
                            }
                        }
                    }
                }
            },
            orderBy: { lastName: "asc" }
        });

        return NextResponse.json(parents);
    } catch (error) {
        console.error("[PARENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST - Create parent account (admin only)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const {
            firstName,
            lastName,
            email,
            phone,
            businessId,
            studentIds,
            relationships
        } = body;

        if (!firstName || !lastName || !email || !businessId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Check if email already exists
        const existing = await prisma.parentAccount.findUnique({
            where: { email }
        });

        if (existing) {
            return new NextResponse("Email already exists", { status: 400 });
        }

        // Generate temporary password
        const tempPassword = crypto.randomBytes(4).toString("hex"); // 8 character password
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create parent account
        const parent = await prisma.parentAccount.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                password: hashedPassword,
                mustChangePassword: true,
                businessId
            }
        });

        // Link to students
        if (studentIds && studentIds.length > 0) {
            await Promise.all(
                studentIds.map((studentId: string, index: number) =>
                    prisma.studentParent.create({
                        data: {
                            studentId,
                            parentId: parent.id,
                            relationship: relationships?.[index] || "GUARDIAN",
                            isPrimary: index === 0
                        }
                    })
                )
            );
        }

        // TODO: Send email with credentials
        // For now, return the temp password (remove in production)
        console.log(`Parent account created: ${email} / ${tempPassword}`);

        return NextResponse.json({
            parent,
            tempPassword // Remove this in production!
        });
    } catch (error) {
        console.error("[PARENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
