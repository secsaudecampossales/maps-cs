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
    <header className="w-full flex justify-center bg-gradient-to-r from-blue-700 via-sky-600 to-sky-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-md">
      <div className="container px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 ml-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-sm">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white drop-shadow-md">
              BRAÇOS ABERTOS
            </h1>
            <span className="text-xs md:text-sm text-sky-100/95 dark:text-sky-100/90 drop-shadow-sm">
              Monitoramento de Gestantes • APS Campos Sales
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
              {mounted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white dark:border-border dark:bg-transparent"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              )}
              {session && (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end leading-tight">
                    <span className="text-xs text-blue-100/80">
                      {session.user?.isAdmin ? "Administrador" : "Profissional de Saúde"}
                    </span>
                    <span className="text-sm font-medium text-white truncate max-w-[180px]">
                      {session.user?.name}
                    </span>
                  </div>
                  {session.user?.isAdmin && (
                    <Button
                      variant="secondary"
                      size="sm"
                      asChild
                      className="hidden sm:inline-flex bg-white/15 text-white border-white/20 hover:bg-white/25"
                    >
                      <a href="/admin">Área Admin</a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white dark:border-border dark:bg-transparent"
                  >
                    Sair
                  </Button>
                </div>
              )}
        </div>
      </div>
    </header>
  )
}

