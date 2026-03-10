"use client"

import { Activity } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function Header() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const INACTIVITY_LIMIT_SECONDS = 15 * 60
  const [remainingSeconds, setRemainingSeconds] = useState(INACTIVITY_LIMIT_SECONDS)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!session) return

    const events = ["click"]

    const resetTimer = () => {
      setRemainingSeconds(INACTIVITY_LIMIT_SECONDS)
    }

    const handleActivity = () => {
      resetTimer()
    }

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity)
    })

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          signOut({ callbackUrl: "/login" })
          return INACTIVITY_LIMIT_SECONDS
        }

        return prev - 1
      })
    }, 1000)

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
      })
      window.clearInterval(intervalId)
    }
  }, [INACTIVITY_LIMIT_SECONDS, session])

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return (
    <header className="w-full flex justify-center bg-gradient-to-r from-blue-700 via-sky-600 to-sky-700 shadow-md">
      <div className="container px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 ml-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-sm">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white drop-shadow-md">
              BRAÇOS ABERTOS
            </h1>
            <span className="text-xs md:text-sm text-sky-100/95 drop-shadow-sm">
              Monitoramento de Gestantes • APS Campos Sales
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
                  <div className="hidden sm:flex flex-col items-end leading-tight">
                    <span className="text-[10px] text-blue-100/80">
                      Sessão será encerrada em
                    </span>
                    <span className="text-xs font-mono text-white">
                      {minutes.toString().padStart(2, "0")}:
                      {seconds.toString().padStart(2, "0")}
                    </span>
                  </div>
                  {session.user?.isAdmin && (
                    <div className="hidden sm:flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        asChild
                        className="bg-white/15 text-white border-white/20 hover:bg-white/25"
                      >
                        <a href="/admin">Área Admin</a>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        asChild
                        className="bg-white/15 text-white border-white/20 hover:bg-white/25"
                      >
                        <a href="/admin/relatorios">Relatórios</a>
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
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

