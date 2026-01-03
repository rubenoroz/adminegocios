import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            businessId?: string;
            businessType?: string;
            enabledModules?: string; // JSON array string
            role?: string;
            isSuperAdmin?: boolean;
        }
    }

    interface User {
        businessId?: string | null;
        role?: string;
        isSuperAdmin?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        businessId?: string | null;
        businessType?: string;
        enabledModules?: string;
        role?: string;
        isSuperAdmin?: boolean;
    }
}
