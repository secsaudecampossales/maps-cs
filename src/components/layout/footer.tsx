export function Footer() {
  return (
    <footer className="border-t border-border bg-background/90 backdrop-blur-sm py-4 mt-8">
      <div className="container mx-auto px-4 flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
        <p className="font-medium tracking-wide text-foreground/70">
          MAPS-CS — APS Campos Sales
        </p>
        <p className="text-[11px] text-muted-foreground">
          Foco em cuidado contínuo, acompanhamento humanizado e tomada de decisão baseada em dados.
        </p>
        <p className="text-[11px] text-muted-foreground/80 pt-1">
          Desenvolvido por <span className="font-medium text-foreground/80">Ednario Andrade</span>
        </p>
      </div>
    </footer>
  )
}

