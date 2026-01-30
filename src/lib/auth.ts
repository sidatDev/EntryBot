import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET || "development-secret-change-in-production",
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Sign in",
            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                    placeholder: "hello@example.com",
                },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                    include: {
                        customRole: {
                            select: { name: true }
                        }
                    }
                });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await compare(
                    credentials.password,
                    user.passwordHash
                );

                if (!isPasswordValid) {
                    return null;
                }

                // Check if user is active
                return {
                    id: user.id + "",
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    organizationId: user.organizationId,
                    customRoleId: user.customRoleId,
                    customRoleName: user.customRole?.name,
                };
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id as string,
                    role: token.role as string,
                    organizationId: token.organizationId as string | null,
                    customRoleId: token.customRoleId as string | null,
                    customRoleName: token.customRoleName as string | null,
                },
            };
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                return {
                    ...token,
                    id: user.id,
                    role: (user as any).role,
                    organizationId: (user as any).organizationId,
                    customRoleId: (user as any).customRoleId,
                    customRoleName: (user as any).customRoleName,
                };
            }
            // Support updating session on client side
            if (trigger === "update" && session) {
                return { ...token, ...session.user };
            }
            return token;
        },
    },
};
