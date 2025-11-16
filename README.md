# ERP Esencial para Funerarias

Sistema web completo para gestionar la operación administrativa y diaria de una funeraria en Chile.

## Stack Tecnológico

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript
- **UI Components**: Untitled UI Components + Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Autenticación**: Supabase Auth completo
- **Validación**: Zod
- **Formularios**: React Hook Form

## Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://eubgswsrqdwebchhnlkj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### 2. Base de Datos

Aplica las migraciones SQL en Supabase:

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a SQL Editor
3. Ejecuta las migraciones en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_functions_and_triggers.sql`
   - `supabase/migrations/004_signup_onboarding.sql`
   - `supabase/migrations/005_rename_columns_to_spanish.sql`
   - `supabase/migrations/006_update_functions_views_spanish.sql`

### 3. Instalación de Dependencias

```bash
npm install
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
app/
├── (auth)/              # Rutas de autenticación
│   └── login/
├── (dashboard)/        # Rutas del dashboard (protegidas)
│   ├── dashboard/
│   ├── servicios/
│   ├── transacciones/
│   ├── egresos/
│   ├── ventas/
│   ├── agenda/
│   ├── nomina/
│   ├── administracion/
│   └── mi-perfil/
lib/
├── supabase/           # Clientes de Supabase
├── actions/            # Server Actions
├── validations/        # Schemas Zod
├── hooks/              # React hooks
├── contexts/           # React contexts
└── utils/              # Utilidades
components/
├── layout/             # Componentes de layout
├── auth/               # Componentes de autenticación
└── ui/                 # Componentes UI (Untitled UI)
supabase/
└── migrations/         # Migraciones SQL
types/
└── database.ts         # Tipos TypeScript de la BD
```

## Módulos Implementados

### ✅ Completados (Phase 1.1-1.3)

- **Database**: Esquema completo con 19 tablas, RLS policies, funciones y triggers
- **TypeScript**: Tipos completos para todas las tablas con Spanish column names
- **UI Components**: Biblioteca completa de componentes reutilizables
- **Autenticación**: Supabase Auth con multi-tenant
- **Layout**: Sidebar y Header con navegación

### 🚧 En Desarrollo

- Validación con Zod para todas las entidades
- Utilidades (currency, date, errors, file)
- Formulario de creación/edición de servicios
- Módulos financieros (Transacciones, Egresos, Ventas)
- Agenda con calendario
- Nómina
- Catálogos de administración
- Dashboard con KPIs

## Roles de Usuario

- **Admin**: Acceso total
- **Ejecutivo**: Gestión de servicios y ventas
- **Operaciones**: Gestión de agenda y colaboradores
- **Caja**: Transacciones y egresos
- **Colaborador**: Solo lectura limitada

## Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Políticas RLS basadas en `funeral_home_id` y `branch_id`
- Validación multi-capa (cliente y servidor)
- Middleware de autenticación

## Licencia

Privado - Uso interno
