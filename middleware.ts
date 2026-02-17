import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isPending = token?.status === "pending";
        const isAdmin = token?.role === "admin";
        const isUserPage = req.nextUrl.pathname.startsWith("/dashboard");
        const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

        if (isPending && (isUserPage || isAdminPage)) {
            // Allow access to a "pending" page or show error? 
            // For now, let's redirect to a specific pending page or handle in component.
            // Actually, middleware is best for redirects.
            // Let's create a /pending page.
            if (req.nextUrl.pathname !== "/pending") {
                return NextResponse.redirect(new URL("/pending", req.url));
            }
        }

        if (isAdminPage && !isAdmin) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/pending"],
};
