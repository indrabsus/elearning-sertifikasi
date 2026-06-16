"use client"

export default function PageLoader() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="relative">
        <div className="h-14 w-14 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>

        <div className="absolute inset-0 h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-500"></div>
      </div>
    </div>
  )
}