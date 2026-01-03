import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";

if (!process.env.NEXTAUTH_SECRET) {
    console.warn("⚠️ NEXTAUTH_SECRET is not set in environment variables. Session decryption may fail.");
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });

                if (!user || !user.password) {
                    console.log("[AUTH] User not found or no password set:", credentials.email);
                    return null;
                }

                // Verify Password
                const isValid = await compare(credentials.password, user.password);
                if (!isValid) {
                    console.log("[AUTH] Invalid password for user:", credentials.email);
                    return null;
                }

                console.log("[AUTH] User authorized successfully:", user.email, "Role:", user.role);
                return user;
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!;
                session.user.businessId = token.businessId as string;
                session.user.businessType = token.businessType as string;
                session.user.enabledModules = token.enabledModules as string;
                session.user.role = token.role as string;

                // Debug Session
                // console.log("[AUTH-SESSION] Session callback for:", session.user.email, "Role:", session.user.role);
            }
            return session;
        },
        async jwt({ token, user }) {
            // Initial sign in
            if (user) {
                console.log("[AUTH-JWT] Initial signin token creation for:", user.email);
                token.businessId = user.businessId;
                token.role = user.role;

                if (user.businessId) {
                    const business = await prisma.business.findUnique({
                        where: { id: user.businessId },
                        select: { type: true, enabledModules: true }
                    });
                    token.businessType = business?.type;
                    token.enabledModules = business?.enabledModules ?? undefined;
                }
            }
            // Subsequent calls - Re-fetch from DB to stay in sync
            else if (token.sub) {
                // console.log("[AUTH-JWT] Token refresh for sub:", token.sub);
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { role: true, businessId: true }
                });

                if (dbUser) {
                    token.role = dbUser.role;
                    token.businessId = dbUser.businessId;

                    if (dbUser.businessId) {
                        const business = await prisma.business.findUnique({
                            where: { id: dbUser.businessId },
                            select: { type: true, enabledModules: true }
                        });
                        token.businessType = business?.type;
                        token.enabledModules = business?.enabledModules ?? undefined;
                    }
                }
            }
            return token;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};
