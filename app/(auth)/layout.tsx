'use client'

import { ShieldTick, CalendarCheck01, LayersThree01 } from "@untitledui/icons";
import type { ReactNode } from "react";

const CURRENT_YEAR = new Date().getFullYear();

const highlights = [
  {
    icon: ShieldTick,
    title: "Accesos para tu equipo",
    description: "Decide quién puede revisar pagos, documentos y servicios según su rol.",
  },
  {
    icon: CalendarCheck01,
    title: "Agenda al día",
    description: "Confirma velatorios, salas y traslados con recordatorios claros para todos.",
  },
  {
    icon: LayersThree01,
    title: "Sucursales coordinadas",
    description: "Trabaja con varias funerarias o salas sin duplicar información ni perder seguimiento.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,440px)_1fr]">
        <aside className="relative hidden overflow-hidden border-r border-[var(--color-border-secondary)] bg-[var(--color-bg-brand)]/70 text-[var(--color-text-brand-on-brand)] lg:flex lg:flex-col">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,102,204,0.45),rgba(3,16,46,0.92))]" />
          <div className="relative z-10 flex flex-1 flex-col justify-between px-12 py-12">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                ERP Esencial para Funerarias
              </span>
              <div className="space-y-4">
                <h1 className="text-3xl font-semibold leading-tight text-white">
                  Tu panel diario para acompañar a cada familia
                </h1>
                <p className="max-w-sm text-base text-white/80">
                  Registra servicios, arma presupuestos, coordina velatorios y controla pagos desde un mismo lugar pensado para encargadas y encargados de sala.
                </p>
              </div>
            </div>

            <ul className="mt-12 space-y-6">
              {highlights.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
                    <Icon size={20} className="text-white" />
                  </span>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-sm leading-6 text-white/70">{description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="pt-8 text-xs font-medium uppercase tracking-[0.28em] text-white/50">
              © {CURRENT_YEAR} ERP Funerarias · Mejora continua
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16 lg:px-12 lg:py-20">
          <div className="w-full max-w-[480px] sm:max-w-[540px] md:max-w-[600px] lg:max-w-[640px] xl:max-w-[680px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
