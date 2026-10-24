import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-6">
          <span className="text-sm font-medium">CareFlow</span>
          <span className="text-xs text-muted-foreground">
            frontend architecture only
          </span>
        </div>
      </header>
      {children}
      <footer className="border-t">
        <div className="mx-auto w-full max-w-4xl px-6 py-4 text-xs text-muted-foreground">
          Template sem telas de produto. Configure o tema e adicione features
          em src/features.
        </div>
      </footer>
    </div>
  );
}
