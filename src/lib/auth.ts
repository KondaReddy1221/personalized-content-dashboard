import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'personalized_dashboard_session';

function getSecret() {
  const configuredSecret = process.env.JWT_SECRET;

  if (process.env.NODE_ENV === 'production' && (!configuredSecret || configuredSecret.length < 32)) {
    throw new Error('JWT_SECRET must be set to at least 32 characters in production.');
  }

  return new TextEncoder().encode(
    configuredSecret || 'local-development-secret-change-me-in-production',
  );
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export async function signSessionToken(user: SessionUser) {
  return new SignJWT({ userId: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as {
    userId: string;
    email: string;
    name: string;
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const payload = await verifySessionToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  return user;
}
