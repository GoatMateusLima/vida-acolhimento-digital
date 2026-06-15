import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ProfileSwitcher } from "@/components/common/ProfileSwitcher";
import { InstallButton } from "@/components/pwa/InstallButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/sobre", label: "Sobre" },
  { to: "/seguranca", label: "Segurança" },
] as const;

export function PublicLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur safe-top">
        <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
          <Link to="/" aria-label="Página inicial VIDA+"><Logo /></Link>
          <nav aria-label="Principal" className="hidden justify-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                activeProps={{ className: "text-foreground bg-muted" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 justify-self-end">
            <div className="hidden sm:block"><InstallButton /></div>
            <ThemeToggle />
            <Link to="/login" className="hidden md:block">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/cadastro" className="hidden md:block">
              <Button size="sm">Cadastrar</Button>
            </Link>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-11 w-11" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="mt-2 flex flex-col gap-1">
                  {NAV.map((n) => (
                    <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted">
                      {n.label}
                    </Link>
                  ))}
                  <div className="my-2 border-t" />
                  <Link to="/login" onClick={() => setOpen(false)}><Button variant="outline" className="w-full">Entrar</Button></Link>
                  <Link to="/cadastro" onClick={() => setOpen(false)}><Button className="w-full">Cadastrar</Button></Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-card/40 mt-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground text-pretty">
              Plataforma de acolhimento e escuta emocional. Não oferecemos diagnóstico médico.
            </p>
          </div>
          <nav aria-label="Institucional" className="text-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plataforma</h3>
            <ul className="space-y-1.5">
              <li><Link to="/como-funciona" className="hover:underline">Como funciona</Link></li>
              <li><Link to="/sobre" className="hover:underline">Sobre o VIDA+</Link></li>
              <li><Link to="/seguranca" className="hover:underline">Segurança e privacidade</Link></li>
            </ul>
          </nav>
          <nav aria-label="Legal" className="text-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</h3>
            <ul className="space-y-1.5">
              <li><Link to="/termos" className="hover:underline">Termos de uso</Link></li>
              <li><Link to="/privacidade" className="hover:underline">Política de privacidade</Link></li>
            </ul>
          </nav>
        </div>
        <div className="border-t">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} VIDA+. Em emergência ligue para o CVV 188 ou SAMU 192.
          </p>
        </div>
      </footer>
    </div>
  );
}
