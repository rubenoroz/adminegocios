"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface BrandingContextType {
    logoUrl: string | null;
    logoOrientation: "HORIZONTAL" | "VERTICAL" | "SQUARE";
    primaryColor: string;
    sidebarColor: string;
    logoHeight: number;
    loading: boolean;
    updateLogo: (file: File) => Promise<void>;
    updateColors: (colors: { primaryColor?: string; sidebarColor?: string; logoHeight?: number }) => Promise<void>;
    refetch: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoOrientation, setLogoOrientation] = useState<"HORIZONTAL" | "VERTICAL" | "SQUARE">("SQUARE");
    const [primaryColor, setPrimaryColor] = useState("#3b82f6");
    const [sidebarColor, setSidebarColor] = useState("#0f172a");
    const [logoHeight, setLogoHeight] = useState(64);
    const [loading, setLoading] = useState(true);

    const fetchBranding = async () => {
        if (!session?.user) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/business/branding");
            if (response.ok) {
                const data = await response.json();
                setLogoUrl(data.logoUrl || null);
                setLogoOrientation(data.logoOrientation || "SQUARE");
                setPrimaryColor(data.primaryColor || "#3b82f6");
                setSidebarColor(data.sidebarColor || "#0f172a");
                setLogoHeight(data.logoHeight || 64);
            }
        } catch (error) {
            console.error("Error fetching branding:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranding();
    }, [session]);

    // Apply colors to CSS variables
    useEffect(() => {
        if (typeof window !== "undefined") {
            document.documentElement.style.setProperty("--primary-color", primaryColor);
            document.documentElement.style.setProperty("--sidebar-bg", sidebarColor);
        }
    }, [primaryColor, sidebarColor]);

    const updateLogo = async (file: File) => {
        const formData = new FormData();
        formData.append("logo", file);

        const response = await fetch("/api/business/logo", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Error al subir logotipo");
        }

        const data = await response.json();
        setLogoUrl(data.logoUrl);
        setLogoOrientation(data.logoOrientation);
    };

    const updateColors = async (colors: { primaryColor?: string; sidebarColor?: string; logoHeight?: number }) => {
        const response = await fetch("/api/business/branding", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(colors),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Error al actualizar colores");
        }

        const data = await response.json();
        if (colors.primaryColor) setPrimaryColor(colors.primaryColor);
        if (colors.sidebarColor) setSidebarColor(colors.sidebarColor);
        if (colors.logoHeight) setLogoHeight(colors.logoHeight);
    };

    return (
        <BrandingContext.Provider
            value={{
                logoUrl,
                logoOrientation,
                primaryColor,
                sidebarColor,
                logoHeight,
                loading,
                updateLogo,
                updateColors,
                refetch: fetchBranding,
            }}
        >
            {children}
        </BrandingContext.Provider>
    );
}

export function useBranding() {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error("useBranding must be used within a BrandingProvider");
    }
    return context;
}
