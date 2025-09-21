export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/products/:path*", "/warehouses/:path*", "/sales/:path*", "/purchases/:path*", "/expenses/:path*"],
};

