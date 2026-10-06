import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

if (!globalThis.TextEncoder) {
	globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}

if (!globalThis.TextDecoder) {
	globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

class MockHeaders {
	private map = new Map<string, string>();

	constructor(init?: Record<string, string> | string[][] | Headers) {
		if (!init) return;

		if (Array.isArray(init)) {
			for (const [key, value] of init) {
				this.map.set(key.toLowerCase(), value);
			}
			return;
		}

		const headerObject = init as Headers;

		if (typeof headerObject?.forEach === 'function') {
			headerObject.forEach((value: string, key: string) => {
				this.map.set(key.toLowerCase(), value);
			});
			return;
		}

		Object.entries(init).forEach(([key, value]) => {
			this.map.set(key.toLowerCase(), String(value));
		});
	}

	get(name: string) {
		return this.map.get(name.toLowerCase()) ?? null;
	}

	set(name: string, value: string) {
		this.map.set(name.toLowerCase(), value);
	}

	has(name: string) {
		return this.map.has(name.toLowerCase());
	}

	delete(name: string) {
		this.map.delete(name.toLowerCase());
	}

	forEach(callback: (value: string, key: string) => void) {
		this.map.forEach((value, key) => callback(value, key));
	}
}

class MockRequest {
	url: string;
	method: string;
	headers: MockHeaders;
	body: string | null;

	constructor(input: string | URL, init?: RequestInit) {
		this.url = String(input);
		this.method = (init?.method ?? 'GET').toUpperCase();
		this.headers = new MockHeaders((init?.headers as Record<string, string>) ?? {});
		this.body = typeof init?.body === 'string' ? init.body : null;
	}

	async json() {
		return this.body ? JSON.parse(this.body) : null;
	}

	async text() {
		return this.body ?? '';
	}
}

class MockResponse {
	status: number;
	headers: MockHeaders;
	body: string | null;
	private mockCookies = {
		set: (cookie: {
			name: string;
			value: string;
			path?: string;
			httpOnly?: boolean;
			sameSite?: string;
			secure?: boolean;
			maxAge?: number;
		}) => {
			const attributes = ['Path=' + (cookie.path ?? '/')];

			if (cookie.httpOnly) attributes.push('HttpOnly');
			if (cookie.sameSite) attributes.push(`SameSite=${cookie.sameSite}`);
			if (cookie.secure) attributes.push('Secure');
			if (typeof cookie.maxAge === 'number') attributes.push(`Max-Age=${cookie.maxAge}`);

			const cookieValue = `${cookie.name}=${cookie.value}; ${attributes.join('; ')}`;
			const previous = this.headers.get('set-cookie');
			this.headers.set('set-cookie', previous ? `${previous}, ${cookieValue}` : cookieValue);
		},
	};

	get cookies() {
		return this.mockCookies;
	}

	constructor(body?: BodyInit | null, init?: ResponseInit) {
		this.body = typeof body === 'string' ? body : body ? String(body) : null;
		this.status = init?.status ?? 200;
		this.headers = new MockHeaders((init?.headers as Record<string, string>) ?? {});
	}

	static json(data: unknown, init?: ResponseInit) {
		return new MockResponse(JSON.stringify(data), {
			...init,
			headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
		});
	}

	async json() {
		return this.body ? JSON.parse(this.body) : null;
	}

	async text() {
		return this.body ?? '';
	}
}

if (!globalThis.Request) {
	globalThis.Request = MockRequest as typeof globalThis.Request;
}

if (!globalThis.Response) {
	globalThis.Response = MockResponse as typeof globalThis.Response;
}

if (!globalThis.Headers) {
	globalThis.Headers = MockHeaders as typeof globalThis.Headers;
}
