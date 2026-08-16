import { Link, useRouter } from "@tanstack/react-router";
import { Menu, Moon, Sun, Terminal, LogOut } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Gerador" },
  { to: "/meus-estudos", label: "Meus estudos" },
  { to: "/painel", label: "Meu aprendizado" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
              <Terminal className="size-4 text-primary" />
            </span>
            <span className="leading-tight">
              <span className="block font-mono text-sm font-bold tracking-[0.18em] text-neon">
                INSTITUTO UNDERGROUND
              </span>
              <span className="block text-[11px] text-muted-foreground">Gerador Inteligente de Estudos</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                activeProps={{ className: "text-primary bg-accent/30" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            {user ? (
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
                <LogOut className="size-4" />
              </Button>
            ) : (
              <Link to="/auth" className="hidden md:block">
                <Button size="sm">Entrar</Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>

        {open && (
          <nav className="flex flex-col gap-1 border-t border-border/70 px-4 py-3 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                activeProps={{ className: "text-primary bg-accent/30" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            {!user && (
              <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-primary">
                Entrar
              </Link>
            )}
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
