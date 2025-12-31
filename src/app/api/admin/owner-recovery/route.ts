import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/admin/owner-recovery - List recovery requests for a business
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get("businessId");

        const where = businessId ? { businessId } : {};

        const requests = await prisma.ownerRecoveryRequest.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                business: {
                    select: { id: true, name: true }
                }
            }
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error("Error fetching recovery requests:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/admin/owner-recovery - Create a new recovery/transfer request
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { businessId, type, reason, currentOwnerId, newOwnerId, newOwnerEmail } = body;

        if (!businessId || !type) {
            return NextResponse.json(
                { error: "businessId and type are required" },
                { status: 400 }
            );
        }

        if (!["RECOVERY", "TRANSFER"].includes(type)) {
            return NextResponse.json(
                { error: "type must be RECOVERY or TRANSFER" },
                { status: 400 }
            );
        }

        // Check if there's already a pending request for this business
        const existingRequest = await prisma.ownerRecoveryRequest.findFirst({
            where: {
                businessId,
                status: "PENDING"
            }
        });

        if (existingRequest) {
            return NextResponse.json(
                { error: "Ya existe una solicitud pendiente para este negocio" },
                { status: 400 }
            );
        }

        // Create the request
        const request = await prisma.ownerRecoveryRequest.create({
            data: {
                type,
                businessId,
                currentOwnerId,
                newOwnerId: type === "TRANSFER" ? newOwnerId : null,
                newOwnerEmail: type === "TRANSFER" ? newOwnerEmail : null,
                requestedBy: session.user.email || session.user.id,
                reason,
                status: "PENDING"
            }
        });

        return NextResponse.json(request, { status: 201 });
    } catch (error) {
        console.error("Error creating recovery request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
