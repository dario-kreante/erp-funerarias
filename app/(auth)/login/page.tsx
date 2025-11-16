'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowRight } from "@untitledui/icons"
import { createClient } from "@/lib/supabase/client"
import { cx } from "@/lib/utils/cx"

const inputStyles = cx(
  "block w-full rounded-2xl border border-[var(--color-border-secondary)]",
  "bg-[var(--color-bg-primary)] px-4 py-3 text-[var(--color-text-primary)]",
  "shadow-[var(--shadow-xs)] outline-none transition focus:border-[var(--color-border-brand)]",
  "focus:ring-2 focus:ring-[var(--color-border-brand)] focus:ring-offset-0",
  "placeholder:text-[var(--color-text-tertiary)]"
)

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError
      if (data.user) {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10">
      <header className="space-y-3 text-left">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-bg-brand)]/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-brand)]">
          Tu apoyo diario en la funeraria
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] sm:text-3xl md:text-[2rem]">
            Ingresa para continuar con tus servicios en curso
          </h1>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base sm:leading-7">
            Usa tu correo y contraseña para seguir los servicios activos, coordinar salas y traslados, y revisar pagos sin saltar entre planillas.
          </p>
        </div>
      </header>

      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] shadow-[var(--shadow-lg)] sm:rounded-3xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-bg-brand-solid)] via-[#7F56D9] to-[var(--color-bg-brand-solid_hover)]" />
        <form className="space-y-5 px-5 pb-6 pt-8 sm:space-y-6 sm:px-6 sm:pb-8 sm:pt-10 md:px-8 md:pb-10 md:pt-12" onSubmit={handleLogin}>
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-border-error)] bg-[var(--color-bg-error)]/60 px-4 py-3 text-sm text-[var(--color-text-error)]">
              <AlertTriangle className="mt-0.5 shrink-0 text-[var(--color-text-error)]" size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[var(--color-text-primary)]">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputStyles}
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-[var(--color-text-primary)]">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--color-text-brand)] transition hover:text-[var(--color-bg-brand-solid_hover)]"
                >
                  Recuperar acceso
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputStyles}
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border-tertiary)] bg-[var(--color-bg-tertiary)]/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Mantén cada paso bajo control
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Revisa servicios, cobros, documentos y agenda en minutos desde tu panel.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-brand)]/40 px-3 py-1 text-xs font-medium text-[var(--color-text-brand)]">
                Acceso reservado para tu funeraria
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cx(
              "group flex w-full items-center justify-center gap-2 rounded-2xl",
              "bg-[var(--color-bg-brand-solid)] px-5 py-3 text-sm font-semibold text-[var(--color-text-brand-on-brand)]",
              "transition hover:bg-[var(--color-bg-brand-solid_hover)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-border-brand)] focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-[1.5px] border-white/60 border-t-white" aria-hidden />
                Procesando...
              </span>
            ) : (
              <>
                Iniciar sesión
                <ArrowRight
                  size={18}
                  className="transition duration-150 group-hover:translate-x-1"
                  color="currentColor"
                />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="space-y-2 text-center text-xs text-[var(--color-text-secondary)] sm:text-sm">
        <p>
          ¿Es tu primera vez aquí?{" "}
          <a
            href="/signup"
            className="font-semibold text-[var(--color-text-brand)] hover:text-[var(--color-bg-brand-solid_hover)] transition"
          >
            Crea tu consola en minutos
          </a>
          .
        </p>
        <p>
          ¿Necesitas una cuenta o más accesos?{" "}
          <a
            href="mailto:soporte@erpfunerarias.cl"
            className="font-semibold text-[var(--color-text-brand)] hover:text-[var(--color-bg-brand-solid_hover)] transition"
          >
            Habla con el administrador de tu funeraria
          </a>
          .
        </p>
      </div>
    </div>
  )
}
