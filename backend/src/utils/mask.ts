/**
 * Mask an email address: a]***@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 5))}@${domain}`;
}

/**
 * Mask a phone number: +2010****5678
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '****';
  const visible = 4;
  const start = phone.slice(0, Math.max(4, phone.length - visible - 4));
  const end = phone.slice(-visible);
  const masked = '*'.repeat(Math.max(4, phone.length - start.length - end.length));
  return `${start}${masked}${end}`;
}
