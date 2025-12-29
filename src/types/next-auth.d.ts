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
            role?: string;
        }
    }

    interface User {
        businessId?: string | null;
        role?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        businessId?: string | null;
        businessType?: string;
        role?: string;
    }
}
