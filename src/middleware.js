import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Permitir acesso livre à página de setup e API de setup
  if (pathname.startsWith('/setup') || pathname === '/api/setup') {
    return NextResponse.next();
  }

  // Permitir acesso à API de auth
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Verificar se o sistema precisa de setup (primeiro acesso)
  try {
    const setupCheckUrl = new URL('/api/setup', request.url);
    const setupResponse = await fetch(setupCheckUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (setupResponse.ok) {
      const data = await setupResponse.json();

      // Se precisa de setup e não está na página de setup, redirecionar
      if (data.needsSetup && !pathname.startsWith('/setup')) {
        const setupUrl = new URL('/setup', request.url);
        return NextResponse.redirect(setupUrl);
      }

      // Se não precisa de setup e está na página de setup, redirecionar para login
      if (!data.needsSetup && pathname.startsWith('/setup')) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  } catch (error) {
    console.error('Erro ao verificar setup:', error);
  }

  // Verificar autenticação para rotas protegidas
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/assets')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
