# ADR 0004 — Chat com Gemini e fallback mock

- **Status:** aceito
- **Data:** 2026-10-22

## Contexto

O chat será usado em demo e precisa funcionar mesmo com internet instável,
quota esgotada ou chave sem acesso ao modelo escolhido.

## Decisão

- `POST /api/chat` exige autenticação.
- Provider abstrato com duas implementações: Gemini e mock.
- Gemini via `@google/genai`.
- Modelo padrão `gemini-3.5-flash-lite`; se indisponível ou sem permissão,
  tentar `gemini-3.1-flash-lite` e `gemini-2.5-flash-lite`.
- Em erro, timeout, quota ou ausência de chave, responder com mock.
- Histórico stateless, limitado a 20 mensagens e 16.000 caracteres.
- `GEMINI_MAX_OUTPUT_TOKENS=512` para controlar custo/latência.

## Consequências

- Demo sempre responde.
- A resposta indica `provider` para evitar confundir mock com Gemini.
- CI não precisa de chave.
- Persistência de conversas fica para uma fase posterior.
