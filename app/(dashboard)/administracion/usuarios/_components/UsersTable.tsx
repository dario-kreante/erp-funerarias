'use client'

import { useState } from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyTableState,
} from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils/date'
import { deactivateUser, reactivateUser, updateUserRole } from '@/lib/actions/users'
import { exportToCSV, exportToExcel, exportToPDF, formatters } from '@/lib/utils/export'
import type { Profile, Branch, UserRole } from '@/types/database'

interface UsersTableProps {
  users: (Profile & { user_branches?: { branch_id: string; branch: Branch }[] })[]
  branches: Branch[]
}

export function UsersTable({ users, branches }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [newRole, setNewRole] = useState<UserRole>('colaborador')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    ejecutivo: 'Ejecutivo',
    operaciones: 'Operaciones',
    caja: 'Caja',
    colaborador: 'Colaborador',
  }

  const roleOptions = [
    { value: '', label: 'Todos los roles' },
    { value: 'admin', label: 'Administrador' },
    { value: 'ejecutivo', label: 'Ejecutivo' },
    { value: 'operaciones', label: 'Operaciones' },
    { value: 'caja', label: 'Caja' },
    { value: 'colaborador', label: 'Colaborador' },
  ]

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'true', label: 'Activos' },
    { value: 'false', label: 'Inactivos' },
  ]

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || user.role === roleFilter
    const matchesStatus =
      !statusFilter || user.estado_activo.toString() === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleRoleChange = async () => {
    if (!selectedUser) return
    setIsLoading(true)
    setMessage(null)

    try {
      const result = await updateUserRole({ user_id: selectedUser.id, role: newRole })
      if (result.success) {
        setMessage({ type: 'success', text: 'Rol actualizado correctamente' })
        setShowRoleModal(false)
        setSelectedUser(null)
      } else {
        setMessage({ type: 'error', text: result.error.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar el rol' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!selectedUser) return
    setIsLoading(true)
    setMessage(null)

    try {
      const result = selectedUser.estado_activo
        ? await deactivateUser({ user_id: selectedUser.id })
        : await reactivateUser(selectedUser.id)

      if (result.success) {
        setMessage({
          type: 'success',
          text: selectedUser.estado_activo
            ? 'Usuario desactivado correctamente'
            : 'Usuario reactivado correctamente',
        })
        setShowDeactivateModal(false)
        setSelectedUser(null)
      } else {
        setMessage({ type: 'error', text: result.error.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cambiar estado del usuario' })
    } finally {
      setIsLoading(false)
    }
  }

  const exportColumns = [
    { key: 'nombre_completo', header: 'Nombre', width: 150 },
    { key: 'email', header: 'Email', width: 200 },
    {
      key: 'role',
      header: 'Rol',
      width: 100,
      format: (value: unknown) => roleLabels[String(value)] || String(value),
    },
    {
      key: 'estado_activo',
      header: 'Estado',
      width: 80,
      format: formatters.boolean,
    },
    {
      key: 'created_at',
      header: 'Fecha Creación',
      width: 120,
      format: formatters.date,
    },
  ]

  const handleExportCSV = () => {
    exportToCSV(filteredUsers, exportColumns, `usuarios_${new Date().toISOString().split('T')[0]}`)
  }

  const handleExportExcel = () => {
    exportToExcel(
      filteredUsers,
      exportColumns,
      `usuarios_${new Date().toISOString().split('T')[0]}`,
      'Usuarios'
    )
  }

  const handleExportPDF = () => {
    exportToPDF(filteredUsers, exportColumns, {
      title: 'Listado de Usuarios',
      subtitle: `Total: ${filteredUsers.length} usuarios`,
      orientation: 'landscape',
    })
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>{message.text}</Alert>
      )}

      {/* Filters and Export */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={roleOptions}
            selectedKey={roleFilter}
            onSelectionChange={(key) => setRoleFilter(String(key))}
            placeholder="Filtrar por rol"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={statusOptions}
            selectedKey={statusFilter}
            onSelectionChange={(key) => setStatusFilter(String(key))}
            placeholder="Filtrar por estado"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onPress={handleExportCSV}>
            CSV
          </Button>
          <Button variant="secondary" size="sm" onPress={handleExportExcel}>
            Excel
          </Button>
          <Button variant="secondary" size="sm" onPress={handleExportPDF}>
            PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Sucursales</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead align="right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <EmptyTableState message="No se encontraron usuarios" />
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.nombre_completo}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary">{roleLabels[user.role] || user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.user_branches?.map((ub) => (
                        <Badge key={ub.branch_id} variant="default" size="sm">
                          {ub.branch?.nombre}
                        </Badge>
                      ))}
                      {(!user.user_branches || user.user_branches.length === 0) && (
                        <span className="text-xs text-gray-400">Sin asignar</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.estado_activo ? 'success' : 'error'}>
                      {user.estado_activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell align="right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          setSelectedUser(user)
                          setNewRole(user.role)
                          setShowRoleModal(true)
                        }}
                      >
                        Cambiar Rol
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          setSelectedUser(user)
                          setShowDeactivateModal(true)
                        }}
                      >
                        {user.estado_activo ? 'Desactivar' : 'Reactivar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Change Role Modal */}
      <Modal
        isOpen={showRoleModal}
        onOpenChange={setShowRoleModal}
        title="Cambiar Rol de Usuario"
        description={selectedUser ? `Usuario: ${selectedUser.nombre_completo}` : ''}
      >
        <div className="space-y-4">
          <Select
            label="Nuevo Rol"
            options={roleOptions.filter((o) => o.value !== '')}
            selectedKey={newRole}
            onSelectionChange={(key) => setNewRole(key as UserRole)}
          />
          <ModalFooter>
            <Button variant="secondary" onPress={() => setShowRoleModal(false)}>
              Cancelar
            </Button>
            <Button onPress={handleRoleChange} isLoading={isLoading}>
              Guardar
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Deactivate/Reactivate Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onOpenChange={setShowDeactivateModal}
        title={selectedUser?.estado_activo ? 'Desactivar Usuario' : 'Reactivar Usuario'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {selectedUser?.estado_activo
              ? `¿Estás seguro de que deseas desactivar al usuario ${selectedUser?.nombre_completo}? El usuario no podrá acceder al sistema.`
              : `¿Estás seguro de que deseas reactivar al usuario ${selectedUser?.nombre_completo}?`}
          </p>
          <ModalFooter>
            <Button variant="secondary" onPress={() => setShowDeactivateModal(false)}>
              Cancelar
            </Button>
            <Button
              variant={selectedUser?.estado_activo ? 'danger' : 'primary'}
              onPress={handleDeactivate}
              isLoading={isLoading}
            >
              {selectedUser?.estado_activo ? 'Desactivar' : 'Reactivar'}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}
