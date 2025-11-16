'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRight } from '@untitledui/icons'
import { createClient } from '@/lib/supabase/client'
import { cx } from '@/lib/utils/cx'

const inputStyles = cx(
  'block w-full rounded-2xl border border-[var(--color-border-secondary)]',
  'bg-[var(--color-bg-primary)] px-4 py-3 text-[var(--color-text-primary)]',
  'shadow-[var(--shadow-xs)] outline-none transition focus:border-[var(--color-border-brand)]',
  'focus:ring-2 focus:ring-[var(--color-border-brand)] focus:ring-offset-0',
  'placeholder:text-[var(--color-text-tertiary)]'
)

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [funeralHomeLegalName, setFuneralHomeLegalName] = useState('')
  const [funeralHomeTradeName, setFuneralHomeTradeName] = useState('')
  const [funeralHomeRut, setFuneralHomeRut] = useState('')
  const [branchName, setBranchName] = useState('Casa matriz')
  const [branchAddress, setBranchAddress] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          funeralHomeLegalName,
          funeralHomeTradeName,
          funeralHomeRut,
          branchName,
          branchAddress,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = data?.error ?? 'No se pudo crear la cuenta'
        throw new Error(message)
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10">
      <header className="space-y-3 text-left">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-bg-brand)]/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-brand)]">
          Configuración inicial
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] sm:text-3xl md:text-[2rem]">
            Configura tu panel de trabajo
          </h1>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base sm:leading-7">
            Registra los datos básicos de tu funeraria y crea el usuario administrador para comenzar a operar.
          </p>
        </div>
      </header>

      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] shadow-[var(--shadow-lg)] sm:rounded-3xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-bg-brand-solid)] via-[#7F56D9] to-[var(--color-bg-brand-solid_hover)]" />

        <form className="space-y-6 px-5 pb-6 pt-8 sm:space-y-8 sm:px-6 sm:pb-8 sm:pt-10 md:px-8 md:pb-10 md:pt-12" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-border-error)] bg-[var(--color-bg-error)]/60 px-4 py-3 text-sm text-[var(--color-text-error)]">
              <AlertTriangle className="mt-0.5 shrink-0 text-[var(--color-text-error)]" size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-5 sm:space-y-6">
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)] sm:text-sm">
                Datos del administrador
              </h2>
              <div className="grid gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium text-[var(--color-text-primary)]">
                    Nombre completo
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={inputStyles}
                    placeholder="Nombre y apellido"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-[var(--color-text-primary)]">
                    Correo electrónico corporativo
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
                    placeholder="admin@tufuneraria.cl"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-[var(--color-text-primary)]">
                      Contraseña
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={inputStyles}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--color-text-primary)]">
                      Confirmar contraseña
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className={inputStyles}
                      placeholder="Repite tu contraseña"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-[var(--color-border-tertiary)]" />

            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)] sm:text-sm">
                Datos de la funeraria
              </h2>
              <div className="grid gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="funeralHomeLegalName"
                    className="text-sm font-medium text-[var(--color-text-primary)]"
                  >
                    Razón social
                  </label>
                  <input
                    id="funeralHomeLegalName"
                    name="funeralHomeLegalName"
                    type="text"
                    required
                    value={funeralHomeLegalName}
                    onChange={(event) => setFuneralHomeLegalName(event.target.value)}
                    className={inputStyles}
                    placeholder="Funeraria Ejemplo SpA"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="funeralHomeTradeName"
                    className="text-sm font-medium text-[var(--color-text-primary)]"
                  >
                    Nombre de fantasía (opcional)
                  </label>
                  <input
                    id="funeralHomeTradeName"
                    name="funeralHomeTradeName"
                    type="text"
                    value={funeralHomeTradeName}
                    onChange={(event) => setFuneralHomeTradeName(event.target.value)}
                    className={inputStyles}
                    placeholder="Funeraria Central"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="funeralHomeRut" className="text-sm font-medium text-[var(--color-text-primary)]">
                    RUT de la funeraria
                  </label>
                  <input
                    id="funeralHomeRut"
                    name="funeralHomeRut"
                    type="text"
                    required
                    value={funeralHomeRut}
                    onChange={(event) => setFuneralHomeRut(event.target.value)}
                    className={inputStyles}
                    placeholder="12.345.678-9"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)] sm:gap-4">
                  <div className="space-y-2">
                    <label htmlFor="branchName" className="text-sm font-medium text-[var(--color-text-primary)]">
                      Sucursal inicial
                    </label>
                    <input
                      id="branchName"
                      name="branchName"
                      type="text"
                      required
                      value={branchName}
                      onChange={(event) => setBranchName(event.target.value)}
                      className={inputStyles}
                      placeholder="Casa matriz"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="branchAddress" className="text-sm font-medium text-[var(--color-text-primary)]">
                      Dirección de la sucursal (opcional)
                    </label>
                    <input
                      id="branchAddress"
                      name="branchAddress"
                      type="text"
                      value={branchAddress}
                      onChange={(event) => setBranchAddress(event.target.value)}
                      className={inputStyles}
                      placeholder="Calle, número, comuna"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border-tertiary)] bg-[var(--color-bg-tertiary)]/40 px-4 py-3">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Todo queda listo para trabajar</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Configuraremos la funeraria, la primera sucursal y tu usuario administrador para que luego invites a tu equipo.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cx(
              'group flex w-full items-center justify-center gap-2 rounded-2xl',
              'bg-[var(--color-bg-brand-solid)] px-5 py-3 text-sm font-semibold text-[var(--color-text-brand-on-brand)]',
              'transition hover:bg-[var(--color-bg-brand-solid_hover)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-border-brand)] focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-60'
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span
                  className="size-4 animate-spin rounded-full border-[1.5px] border-white/60 border-t-white"
                  aria-hidden
                />
                Preparando tu cuenta...
              </span>
            ) : (
              <>
                Crear cuenta y continuar
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

      <p className="text-center text-xs text-[var(--color-text-secondary)] sm:text-sm">
        ¿Ya tienes acceso configurado?{' '}
        <a
          href="/login"
          className="font-semibold text-[var(--color-text-brand)] hover:text-[var(--color-bg-brand-solid_hover)] transition"
        >
          Inicia sesión aquí
        </a>
      </p>
    </div>
  )
}


