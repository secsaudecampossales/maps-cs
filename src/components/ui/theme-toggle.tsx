"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  variant?: "ghost" | "outline" | "default" | "secondary"
}

export function ThemeToggle({ className, variant = "ghost" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size="icon"
        className={cn("h-9 w-9 rounded-lg", className)}
        aria-label="Alternar modo escuro"
        disabled
      >
        <span className="h-5 w-5" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark" || theme === "dark"

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "h-9 w-9 rounded-lg transition-colors cursor-pointer",
        className
      )}
      title={isDark ? "Mudar para modo claro (Sol)" : "Mudar para modo escuro (Lua)"}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-400 transition-transform duration-300 hover:rotate-90 hover:scale-110" />
      ) : (
        <Moon className="h-5 w-5 text-white transition-transform duration-300 hover:-rotate-12 hover:scale-110" />
      )}
    </Button>
  )
}
