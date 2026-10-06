jest.mock('jose', () => ({
  SignJWT: class {
    private payload: Record<string, unknown> | undefined;

    setProtectedHeader() {
      return this;
    }

    setIssuedAt() {
      return this;
    }

    setExpirationTime() {
      return this;
    }

    sign() {
      return Promise.resolve('test-session-token');
    }
  },
  jwtVerify: jest.fn(async () => ({
    payload: { sub: 'test-user-id' },
  })),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => {
      const headers = new Map<string, string>();
      const response = {
        status: init?.status ?? 200,
        headers: {
          get: (name: string) => headers.get(name.toLowerCase()) ?? null,
          set: (name: string, value: string) => headers.set(name.toLowerCase(), value),
        },
        cookies: {
          set: (cookie: { name: string; value: string }) => {
            const previous = headers.get('set-cookie');
            headers.set('set-cookie', previous ? `${previous}, ${cookie.name}=${cookie.value}` : `${cookie.name}=${cookie.value}`);
          },
        },
        json: async () => body,
      };

      return response;
    },
  },
}));

import { POST as registerUser } from '@/app/api/auth/register/route';
import { POST as loginUser } from '@/app/api/auth/login/route';
import { signSessionToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

describe('authentication flow', () => {
  const testEmails = new Set<string>();
  const uniqueEmail = () => {
    const email = `auth-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    testEmails.add(email);
    return email;
  };

  it('requires a strong JWT secret in production', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalJwtSecret = process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    try {
      await expect(
        signSessionToken({ id: 'user-id', name: 'User', email: 'user@example.com' }),
      ).rejects.toThrow('JWT_SECRET must be set to at least 32 characters in production.');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalJwtSecret === undefined) {
        delete process.env.JWT_SECRET;
      } else {
        process.env.JWT_SECRET = originalJwtSecret;
      }
    }
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [...testEmails] } } });
  });

  it('registers a valid user', async () => {
    const email = uniqueEmail();

    const response = await registerUser(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Auth Tester',
          email,
          password: 'Password123',
          confirmPassword: 'Password123',
        }),
      }),
    );

    expect(response.status).toBe(201);
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();
    expect(user?.name).toBe('Auth Tester');
  });

  it('rejects a duplicate email', async () => {
    const email = uniqueEmail();

    await registerUser(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate User',
          email,
          password: 'Password123',
          confirmPassword: 'Password123',
        }),
      }),
    );

    const response = await registerUser(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate User',
          email,
          password: 'Password123',
          confirmPassword: 'Password123',
        }),
      }),
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.message).toContain('already exists');
  });

  it('logs in with valid credentials and creates a session cookie', async () => {
    const email = uniqueEmail();

    await registerUser(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Login User',
          email,
          password: 'Password123',
          confirmPassword: 'Password123',
        }),
      }),
    );

    const response = await loginUser(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'Password123',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('personalized_dashboard_session');
  });

  it('rejects unregistered users', async () => {
    const response = await loginUser(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: uniqueEmail(),
          password: 'Password123',
        }),
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.message).toContain('Account not found. Please register first.');
  });

  it('rejects wrong passwords', async () => {
    const email = uniqueEmail();

    await registerUser(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Wrong Password User',
          email,
          password: 'Password123',
          confirmPassword: 'Password123',
        }),
      }),
    );

    const response = await loginUser(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'WrongPassword',
        }),
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.message).toContain('Invalid email or password.');
  });
});
