# ADR 0008 — Confiança da extração é heurística, não probabilidade

- **Status:** aceito
- **Data:** 2026-10-23

## Contexto

A sugestão de laudo (`ReportSuggestion`) tem um campo `confidence` com
`high | medium | low`, usado para orientar a revisão da navegadora.

Pesquisa e teste com a API do Gemini:

- O `generateContent` não devolve um campo nativo de confiança calibrada.
- O SDK `@google/genai` expõe `avgLogprobs` e `logprobsResult`, mas logprobs dependem do
  modelo.
- Em 2026-10-23, o `gemini-3.5-flash-lite` retornou
  `400 Logprobs is not enabled for this model`.
- Structured Outputs garantem o **formato** JSON, não a veracidade nem uma
  probabilidade.

## Decisão

- Manter `confidence` como **rótulo qualitativo e heurístico**, não como probabilidade.
- O mock deriva o rótulo de regras de palavra-chave e data.
- O Gemini pode devolver o rótulo no JSON, mas o servidor **valida** o
  `evidenceQuote` literal e pode rebaixar o valor quando o trecho for ambíguo.
- `confidence` não muda o estado do caso, não é exibido para a paciente e não é usado
  para decisão clínica automática.
- Se no futuro for necessária confiança calibrada, será preciso um modelo com logprobs
  habilitado ou calibração contra dados rotulados; não usar o rótulo atual como se
  fosse probabilidade.

## Consequências

- A navegadora continua sendo o ponto de confirmação.
- O campo ajuda a priorizar revisão, mas não substitui evidência.
- A UI deve mostrar a origem ("Gemini" ou "regra local") e o trecho de evidência, não
  uma porcentagem de certeza.
- O teste de contrato rejeita `confidence` numérico ou fora do enum.

## Referências

- Gemini API — Structured outputs: <https://ai.google.dev/gemini-api/docs/structured-output>
- SDK `@google/genai`: `Candidate.avgLogprobs` e `Candidate.logprobsResult`;
  `GenerateContentConfig.responseLogprobs` e `logprobs`.
- Teste local em 2026-10-23: `gemini-3.5-flash-lite` + `responseLogprobs: true` →
  `400 Logprobs is not enabled for this model`.
