import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function App() {
  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-16">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Hackathon 2026 — starter pronto</CardTitle>
            <CardDescription>
              A fundação do frontend está configurada. As telas de produto
              entram no evento, depois que o tema for definido.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button>shadcn/ui configurado</Button>
            <Button variant="secondary">React Router pronto</Button>
            <Button variant="outline">API client tipado</Button>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
