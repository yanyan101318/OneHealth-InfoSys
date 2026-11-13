export function getDashboardPath(role) {
  const normalizedRole = role?.trim().toLowerCase()
  return normalizedRole === 'health worker' || normalizedRole === 'encoder'
    ? '/yakap/dashboard'
    : '/dashboard'
}
