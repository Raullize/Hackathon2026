import {
  Bell,
  CalendarDays,
  CheckCircle2,
  LogOut,
  Plus,
  Route,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Calendário', icon: CalendarDays, end: true },
  { to: '/casos/novo', label: 'Novo caso', icon: Plus },
  { to: '/notificacoes', label: 'Notificações', icon: Bell },
  { to: '/concluidos', label: 'Concluídos', icon: CheckCircle2 },
];

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
    isActive
      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Route aria-hidden="true" className="size-4" />
      </div>
      <div className="leading-none">
        <p className="text-sm font-semibold tracking-tight">CareFlow</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Navegação em saúde
        </p>
      </div>
    </div>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="px-4 py-5">
          <Brand />
        </div>

        <div className="px-3">
          <p className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Operação
          </p>
          <nav className="space-y-0.5" aria-label="Navegação principal">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={navClass}>
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium">
              {user?.name?.slice(0, 1).toUpperCase() ?? 'N'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Navegadora
              </p>
            </div>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={handleLogout}
              aria-label="Sair"
              title="Sair"
            >
              <LogOut aria-hidden="true" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Brand />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={handleLogout}
              aria-label="Sair"
            >
              <LogOut aria-hidden="true" />
            </Button>
          </div>
          <nav
            className="flex gap-1 overflow-x-auto border-t px-3 py-2"
            aria-label="Navegação principal"
          >
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs',
                    isActive
                      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      : 'text-muted-foreground',
                  )
                }
              >
                <Icon aria-hidden="true" className="size-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="min-h-svh">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
