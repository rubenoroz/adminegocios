import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.businessId) {
            return NextResponse.json(
                { error: "No autenticado o sin negocio" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("logo") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No se proporcionó archivo" },
                { status: 400 }
            );
        }

        // Validar tipo de archivo
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Formato de archivo no válido. Use PNG, JPG o SVG" },
                { status: 400 }
            );
        }

        // Validar tamaño (2MB máximo)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json(
                { error: "El archivo es demasiado grande. Máximo 2MB" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        let logoOrientation = "SQUARE";
        let processedBuffer = buffer;

        // Procesar imagen si no es SVG
        if (file.type !== "image/svg+xml") {
            const image = sharp(buffer);
            const metadata = await image.metadata();

            // Detectar orientación
            if (metadata.width && metadata.height) {
                const ratio = metadata.width / metadata.height;
                if (ratio > 1.3) {
                    logoOrientation = "HORIZONTAL";
                } else if (ratio < 0.7) {
                    logoOrientation = "VERTICAL";
                } else {
                    logoOrientation = "SQUARE";
                }

                // Redimensionar si es muy grande
                if (metadata.width > 500 || metadata.height > 500) {
                    processedBuffer = await image
                        .resize(500, 500, { fit: "inside" })
                        .toBuffer() as any;
                }
            }
        }

        // Guardar archivo
        const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
        const filename = `${session.user.businessId}-logo.${ext}`;
        const filepath = join(process.cwd(), "public", "uploads", "logos", filename);

        await writeFile(filepath, processedBuffer);

        // Actualizar base de datos
        const logoUrl = `/uploads/logos/${filename}`;
        await prisma.business.update({
            where: { id: session.user.businessId },
            data: {
                logoUrl,
                logoOrientation,
            },
        });

        return NextResponse.json({
            logoUrl,
            logoOrientation,
        });
    } catch (error) {
        console.error("Error uploading logo:", error);
        return NextResponse.json(
            { error: "Error al subir el logotipo" },
            { status: 500 }
        );
    }
}
