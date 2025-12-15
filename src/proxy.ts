import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/documents/:path*",
        "/users/:path*",
        "/roles/:path*",
        "/bank-statements/:path*",
        "/other-documents/:path*",
        "/history/:path*",
        "/recycle-bin/:path*",
        "/integration-data/:path*"
    ],
};
