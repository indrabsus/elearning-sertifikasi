export function getRedirectByRole(role: string) {
  const cleanRole = role.toLowerCase().trim()

  switch (cleanRole) {
    case "admin":
      return "/admin/dashboard"
    case "kurikulum":
      return "/kurikulum/dashboard"
    case "kajur":
      return "/kajur/dashboard"
    case "guru":
      return "/guru/dashboard"
    case "siswa":
      return "/siswa/dashboard"
    default:
      return "/login"
  }
}