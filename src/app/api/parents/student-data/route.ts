import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = req.headers.get("Authorization")?.split(" ")[1];
        const studentId = searchParams.get("studentId");

        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify token
        let decoded: any;
        try {
            decoded = verify(token, JWT_SECRET);
        } catch (error) {
            return new NextResponse("Invalid token", { status: 401 });
        }

        // Verify parent has access to this student
        const relation = await prisma.studentParent.findUnique({
            where: {
                studentId_parentId: {
                    studentId: studentId!,
                    parentId: decoded.id
                }
            }
        });

        if (!relation) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Fetch student data
        const student = await prisma.student.findUnique({
            where: { id: studentId! },
            include: {
                enrollments: {
                    include: {
                        course: true
                    }
                },
                grades: {
                    include: {
                        course: true
                    }
                },
                attendance: {
                    where: {
                        date: {
                            gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) // Last month
                        }
                    },
                    orderBy: { date: "desc" }
                },
                fees: {
                    where: {
                        status: "PENDING"
                    },
                    orderBy: { dueDate: "asc" }
                }
            }
        });

        return NextResponse.json(student);
    } catch (error) {
        console.error("[PARENT_STUDENT_DATA]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
