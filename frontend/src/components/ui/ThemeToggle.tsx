"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <button className="h-10 w-10 rounded-full bg-muted/50 border border-border/30" />
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "relative h-10 w-10 rounded-full border border-border/30 flex items-center justify-center",
        "bg-background/60 backdrop-blur-sm hover:bg-accent/50 transition-all duration-300",
        "hover:shadow-md hover:border-primary/30 active:scale-95"
      )}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-sky-400" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
