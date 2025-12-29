import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { moduleId } = await params;

        const resources = await prisma.resource.findMany({
            where: { moduleId: moduleId },
            orderBy: { order: "asc" },
        });

        return NextResponse.json(resources);
    } catch (error) {
        console.error("[RESOURCES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { moduleId } = await params;
        const { title, url, type } = await req.json();

        const resource = await prisma.resource.create({
            data: {
                title,
                url,
                type,
                moduleId
            }
        });

        return NextResponse.json(resource);
    } catch (error) {
        console.error("[RESOURCES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const resourceId = searchParams.get("resourceId");

        if (!resourceId) {
            return new NextResponse("Resource ID required", { status: 400 });
        }

        const resource = await prisma.resource.delete({
            where: { id: resourceId }
        });

        return NextResponse.json(resource);
    } catch (error) {
        console.error("[RESOURCE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
