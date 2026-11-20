// Reemplazo local del módulo de Lovable (no incluido en el repositorio).
// Solo registra el error en consola; error-capture.ts ya lo intercepta.
export function reportLovableError(error: unknown, context?: Record<string, unknown>): void {
  console.error("[app-error]", error, context ?? {});
}
