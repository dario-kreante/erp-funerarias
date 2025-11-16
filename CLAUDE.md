# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ERP for Chilean funeral homes - multi-tenant web application built with Next.js 16 App Router, Supabase, and TypeScript.

## Development Commands

```bash
npm run dev    # Start development server (http://localhost:3000)
npm run build  # Build for production
npm run lint   # Run ESLint
```

## Architecture

### Multi-Tenant Data Model
- All data is scoped by `funeral_home_id` (organization) and `branch_id` (location)
- Row Level Security (RLS) policies enforce data isolation in PostgreSQL
- Users are assigned to branches via `user_branches` junction table
- Helper functions: `get_user_funeral_home_id()`, `user_has_branch_access()`

### App Router Structure
```
app/(auth)/         # Public auth pages (login, signup)
app/(dashboard)/    # Protected pages with shared layout (sidebar, header)
app/api/            # API routes
```

### Key Patterns

**Server Components + Server Actions**
- Pages are Server Components by default
- Data mutations use Server Actions in `lib/actions/`
- Client Components only where necessary (forms, interactive UI)

**Supabase Client Usage**
- Server Components/Actions: `await createClient()` from `lib/supabase/server.ts`
- Client Components: `createBrowserClient()` from `lib/supabase/client.ts`
- Admin operations (bypassing RLS): `createAdminClient()` from `lib/supabase/admin.ts`

**Authentication Flow**
- Middleware in `middleware.ts` protects dashboard routes
- Redirects unauthenticated users to `/login`
- Session refresh handled automatically

**Form Validation**
- Use Zod schemas from `lib/validations/` for both client and server validation
- React Hook Form for form state management
- Integrate with `@hookform/resolvers`

### Database Conventions

**Column names are in Spanish** matching business domain:
- `nombre_completo` not `full_name`
- `numero_servicio` not `service_number`
- `fecha_fallecimiento` not `death_date`

**Type definitions** are in `types/database.ts`:
- Use `Service`, `Transaction`, etc. for row types
- Use `ServiceInsert`, `TransactionInsert` for inserts
- Use `ServiceWithDetails` for queries with joins

### UI Components

Located in `components/ui/`, built on:
- React Aria Components for accessibility
- Tailwind CSS v4 with Untitled UI theme
- Icons from `@untitledui/icons-react`

Import from `@/components/ui`:
```typescript
import { Button, Input, Modal, Table, Badge, Alert } from '@/components/ui'
```

### Styling

- Use `cx()` from `lib/utils/cx.ts` for conditional class merging
- Theme colors defined in `app/styles/theme.css`
- Color scheme: primary (brand), error, warning, success, gray scales

### Utility Functions

Import from `@/lib/utils`:
```typescript
import {
  formatCurrency, formatDate, formatRut, isValidRut,
  getErrorMessage, success, failure,
  formatFileSize, isValidFileType
} from '@/lib/utils'
```

Key utilities:
- **Currency**: `formatCurrency()`, `parseCurrency()`, `formatCurrencyCompact()`
- **Dates**: `formatDate()`, `formatDateTime()`, `formatRelativeTime()`, `toInputDate()`
- **RUT (Chilean ID)**: `formatRut()`, `isValidRut()`, `validateRutField()`
- **Errors**: `getErrorMessage()`, `success()`, `failure()` for action results
- **Files**: `formatFileSize()`, `isValidFileType()`, `createStoragePath()`

### Branch Context

Current branch selection is managed via `BranchContext`:
```typescript
import { useBranch } from '@/lib/contexts/BranchContext'
const { currentBranch, setCurrentBranch } = useBranch()
```

## Database Migrations

Located in `supabase/migrations/`. Apply in order:
1. `001_initial_schema.sql` - Tables and basic structure
2. `002_rls_policies.sql` - Security policies
3. `003_functions_and_triggers.sql` - Computed fields, auto-generation
4. `004_signup_onboarding.sql` - Tenant creation function
5. `005_rename_columns_to_spanish.sql` - Spanish column names
6. `006_update_functions_views_spanish.sql` - Updated functions/views

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=<supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>  # Server-side only
```

## Key Business Entities

- **Service** (`services`): Core entity - funeral service with deceased info, responsible person, financials
- **Transaction** (`transactions`): Payments received for services
- **Expense** (`expenses`): Outgoing payments, optionally linked to services
- **Collaborator** (`collaborators`): Employees or contractors
- **Mortuary Quota** (`mortuary_quotas`): Government benefit tracking per service

## User Roles

Defined in `user_role` enum: `admin`, `ejecutivo`, `operaciones`, `caja`, `colaborador`
- Permissions controlled via RLS policies based on role
