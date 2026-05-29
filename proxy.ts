import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Como el matcher ya restringe a /admin y /api/admin,
  // sabemos que estamos en una ruta protegida.
  
  const isApiRoute = nextUrl.pathname.startsWith("/api/admin");
  const isLoginPage = nextUrl.pathname === "/admin/login";

  // Si trata de entrar a cualquier ruta protegida sin estar logueado
  if (!isLoggedIn && !isLoginPage) {
    if (isApiRoute) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", nextUrl));
  }

  // Si está logueado y trata de entrar a login, enviarlo al dashboard
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Solo interceptamos rutas administrativas. Liberamos al front-end público de esta carga.
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

