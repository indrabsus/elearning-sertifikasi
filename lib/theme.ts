export type Theme = "light" | "dark"

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"

  const saved = localStorage.getItem("theme") as Theme | null
  return saved || "light"
}

export function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return

  localStorage.setItem("theme", theme)

  if (theme === "dark") {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
}