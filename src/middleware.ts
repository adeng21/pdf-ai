import { authMiddleware } from "@kinde-oss/kinde-auth-nextjs/server"

export const config = {
    // protect these pages for only logged in users
    matcher: ["/dashboard/:path*", "/auth-callback"]
}

export default authMiddleware