/** Bearer öneki ve boşlukları temizler; kaydetmeden önce kullanılır. */
export function normalizeAdminToken(raw: string): string | null {
  let value = raw.trim();
  if (/^bearer\s+/i.test(value)) {
    value = value.replace(/^bearer\s+/i, '').trim();
  }
  return value || null;
}

type JwtPayload = Record<string, unknown>;

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const parsed = JSON.parse(json) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as JwtPayload) : null;
  } catch {
    return null;
  }
}

function formatExp(exp: unknown): string | null {
  if (typeof exp !== 'number') return null;
  const date = new Date(exp * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('tr-TR');
}

function isExpired(exp: unknown, skewMs = 0): boolean {
  if (typeof exp !== 'number') return false;
  return exp * 1000 <= Date.now() + skewMs;
}

/** Client-side JWT exp check (no signature verify). Used to drop stale localStorage sessions. */
export function isAccessTokenExpired(token: string, skewMs = 5_000): boolean {
  const normalized = normalizeAdminToken(token);
  if (!normalized) return true;
  const payload = decodeJwtPayload(normalized);
  if (!payload) return false; // malformed → let server reject
  if (typeof payload.exp !== 'number') return false;
  return isExpired(payload.exp, skewMs);
}

export type AdminTokenDebugInfo = {
  normalizedPreview: string | null;
  jwtValid: boolean;
  userId: string | null;
  email: string | null;
  role: string | null;
  tokenType: string | null;
  exp: string | null;
  warnings: string[];
  errors: string[];
};

export function analyzeAdminToken(raw: string): AdminTokenDebugInfo {
  const normalized = normalizeAdminToken(raw);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!normalized) {
    return {
      normalizedPreview: null,
      jwtValid: false,
      userId: null,
      email: null,
      role: null,
      tokenType: null,
      exp: null,
      warnings,
      errors: ['Token boş.'],
    };
  }

  const preview =
    normalized.length > 24
      ? `${normalized.slice(0, 12)}…${normalized.slice(-8)}`
      : normalized;

  const payload = decodeJwtPayload(normalized);
  if (!payload) {
    errors.push('JWT formatı geçersiz.');
    return {
      normalizedPreview: preview,
      jwtValid: false,
      userId: null,
      email: null,
      role: null,
      tokenType: null,
      exp: null,
      warnings,
      errors,
    };
  }

  const userId =
    payload.userId !== undefined && payload.userId !== null
      ? String(payload.userId)
      : payload.id !== undefined && payload.id !== null
        ? String(payload.id)
        : null;

  const email = typeof payload.email === 'string' ? payload.email : null;
  const role = typeof payload.role === 'string' ? payload.role : null;
  const tokenType = typeof payload.type === 'string' ? payload.type : null;
  const exp = formatExp(payload.exp);

  if (isExpired(payload.exp)) {
    warnings.push('Token süresi dolmuş olabilir.');
  }

  if (tokenType === 'refresh') {
    warnings.push(
      'Bu bir refresh token gibi görünüyor. content-bundle için access token (type: access) kullanın.',
    );
  } else if (tokenType && tokenType !== 'access') {
    warnings.push(`Beklenmeyen token tipi: ${tokenType}`);
  }

  if (role) {
    if (role !== 'admin') {
      warnings.push('Bu token admin yetkisi içermiyor olabilir (JWT role ≠ admin).');
    }
  } else {
    warnings.push(
      'JWT içinde role yok; backend kullanıcı kaydından rol kontrol eder (403 alırsanız hesap admin değildir).',
    );
  }

  return {
    normalizedPreview: preview,
    jwtValid: true,
    userId,
    email,
    role,
    tokenType,
    exp,
    warnings,
    errors,
  };
}
