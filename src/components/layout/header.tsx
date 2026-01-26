"use client"

import { Activity, Sun, Moon } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function Header() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar hidratação mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="border-b border-border bg-background shadow-sm w-full flex justify-center">
      <div className="container px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 ml-2">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-600">BRAÇOS ABERTOS</h1>
        </div>
            <div className="flex items-center gap-4">
              {mounted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-2"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              )}
              {session && (
                <>
                  {session.user?.isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href="/admin">Área Admin</a>
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {session.user?.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    Sair
                  </Button>
                </>
              )}
            </div>
      </div>
    </header>
  )
}

