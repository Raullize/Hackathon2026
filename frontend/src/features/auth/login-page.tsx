import { Eye, EyeOff, Route } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';
import { useAuth } from './auth-context';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from =
    (location.state as { from?: string } | null)?.from ?? '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [from, navigate, user]);

  if (user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Não foi possível entrar. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.72fr)]">
      <section className="relative hidden overflow-hidden bg-primary px-10 py-10 text-primary-foreground lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md border border-primary-foreground/20 bg-primary-foreground/10">
            <Route aria-hidden="true" className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">CareFlow</span>
        </div>

        <div className="mt-auto max-w-md pb-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground/55">
            Operação de navegação
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight">
            O prazo de cada paciente, visível antes de vencer.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
            Acompanhe suspeita, exame, laudo e tratamento em um único calendário
            operacional.
          </p>
          <dl className="mt-10 grid max-w-sm grid-cols-2 gap-6 border-t border-primary-foreground/15 pt-6">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-primary-foreground/55">
                Diagnóstico
              </dt>
              <dd className="mt-1 text-lg font-medium tabular-nums">30 dias</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-primary-foreground/55">
                Tratamento
              </dt>
              <dd className="mt-1 text-lg font-medium tabular-nums">60 dias</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Route aria-hidden="true" className="size-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight">
                CareFlow
              </span>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Acesso restrito
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Entrar no painel
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Use suas credenciais de navegação para acompanhar os casos.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome@instituicao.gov.br"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-4" />
                  ) : (
                    <Eye aria-hidden="true" className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <p
                className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <Button
              className="h-10 w-full"
              size="lg"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-8 border-t pt-4 text-[11px] leading-relaxed text-muted-foreground">
            Acesso exclusivo para a equipe de navegação. Em caso de dúvida,
            procure a coordenação municipal.
          </p>
        </div>
      </section>
    </main>
  );
}
