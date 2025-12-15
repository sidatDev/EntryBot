import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
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
                });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                // Check if user is active
                if (user.status !== "ACTIVE") {
                    return null;
                }

                return {
                    id: user.id + "",
                    email: user.email,
                    name: user.name,
                    role: user.role,
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
                    id: token.id,
                    role: token.role,
                    customRoleId: token.customRoleId,
                    customRoleName: token.customRoleName,
                },
            };
        },
        async jwt({ token, user }) {
            if (user) {
                // Fetch custom role name if exists
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    include: {
                        customRole: {
                            select: { name: true }
                        }
                    }
                });

                return {
                    ...token,
                    id: user.id,
                    role: (user as any).role,
                    customRoleId: dbUser?.customRoleId || null,
                    customRoleName: dbUser?.customRole?.name || null,
                };
            }
            return token;
        },
    },
};
