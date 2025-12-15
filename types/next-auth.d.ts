import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's role. */
            role: string
            id: string
            customRoleId?: string | null
            customRoleName?: string | null
        } & DefaultSession["user"]
        role?: string
    }

    interface User {
        role: string
    }
}

declare module "next-auth/jwt" {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT {
        role: string
        id: string
        customRoleId?: string | null
        customRoleName?: string | null
    }
}
