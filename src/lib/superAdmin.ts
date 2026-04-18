export const SUPER_ADMIN_NIM = '18224066';

export function isSuperAdminNim(nim?: string | null) {
  return nim === SUPER_ADMIN_NIM;
}