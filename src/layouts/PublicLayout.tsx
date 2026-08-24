import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { InstallButton } from "@/components/pwa/InstallButton";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/sobre", label: "Sobre" },
  { to: "/seguranca", label: "Segurança" },
] as const;

export function PublicLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* ─── NAVBAR ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 safe-top">
        <div
          className="absolute inset-0 border-b border-border/60"
          style={{
            background: "color-mix(in oklab, var(--background) 85%, transparent)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
          }}
        />

        <div className="relative mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4">
          {/* Logo */}
          <Link to="/" aria-label="Página inicial VIDA+">
            <Logo />
          </Link>

          {/* Nav desktop */}
          <nav aria-label="Principal" className="hidden justify-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="relative px-4 py-2 text-sm font-medium text-foreground/50
                           hover:text-foreground/90 transition-colors duration-200 rounded-lg
                           hover:bg-foreground/6"
                activeProps={{ className: "text-foreground/90 bg-foreground/8" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Ações direita */}
          <div className="flex items-center gap-2 justify-self-end">
            <div className="hidden sm:block">
              <InstallButton />
            </div>
            <ThemeToggle />
            <Link to="/login" className="hidden md:block">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground/60 hover:text-foreground hover:bg-foreground/8 rounded-lg"
              >
                Entrar
              </Button>
            </Link>
            <Link to="/cadastro" className="hidden md:block">
              <Button
                size="sm"
                className="rounded-full px-5 font-semibold
                           bg-primary text-primary-foreground border-0
                           hover:opacity-90 hover:scale-105 transition-all duration-200"
              >
                Cadastrar
              </Button>
            </Link>

            {/* Menu mobile trigger */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden h-10 w-10 rounded-lg flex items-center justify-center
                         text-foreground/60 hover:text-foreground hover:bg-foreground/8 transition-all"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={open ? "x" : "menu"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Menu mobile dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden border-t border-border/60 md:hidden bg-background"
            >
              <nav className="px-6 py-4 flex flex-col gap-1">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="px-4 py-3 text-base font-medium text-foreground/65 hover:text-foreground
                               hover:bg-foreground/6 rounded-xl transition-all"
                    activeProps={{ className: "text-foreground bg-foreground/8" }}
                    activeOptions={{ exact: n.to === "/" }}
                  >
                    {n.label}
                  </Link>
                ))}
                <div className="mt-3 pt-3 border-t border-border/60 flex flex-col gap-2">
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl">
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/cadastro" onClick={() => setOpen(false)}>
                    <Button className="w-full rounded-xl font-semibold bg-primary text-primary-foreground border-0">
                      Cadastrar
                    </Button>
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── CONTEÚDO PRINCIPAL ──────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ─── FOOTER ──────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <Logo />
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
                Plataforma de acolhimento e escuta emocional gratuita. Conectamos pessoas que
                precisam ser ouvidas a voluntários treinados com empatia.
              </p>
              <p className="mt-4 text-xs text-muted-foreground/50">
                Não oferecemos diagnóstico médico ou acompanhamento terapêutico.
              </p>
            </div>

            {/* Plataforma */}
            <nav aria-label="Plataforma">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                Plataforma
              </h3>
              <ul className="space-y-3">
                {[
                  { to: "/como-funciona", label: "Como funciona" },
                  { to: "/sobre", label: "Sobre o VIDA+" },
                  { to: "/seguranca", label: "Segurança e privacidade" },
                ].map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Legal */}
            <nav aria-label="Legal">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                Legal
              </h3>
              <ul className="space-y-3">
                {[
                  { to: "/termos", label: "Termos de uso" },
                  { to: "/privacidade", label: "Política de privacidade" },
                ].map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="mt-10 pt-6 border-t border-border/60 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1 max-w-xl">
              <p className="text-xs text-muted-foreground/50">
                © {new Date().getFullYear()} VIDA+. Feito com <span className="text-primary">♥</span>{" "}
                por pessoas que se importam.
              </p>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                Projeto desenvolvido voluntariamente pela turma 841 do curso em enfermagem da EEEM Cônego João Batista Sorg - Carazinho/RS e demais voluntários 2026
              </p>
            </div>
            <p className="text-xs text-muted-foreground/50">
              Em emergência: <strong className="text-muted-foreground">CVV 188</strong>
              {" · "}
              <strong className="text-muted-foreground">SAMU 192</strong>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
