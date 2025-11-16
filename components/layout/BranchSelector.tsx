'use client'

import { useState } from 'react'
import { useBranch } from '@/lib/contexts/BranchContext'
import { cx } from '@/lib/utils/cx'

export function BranchSelector() {
  const { selectedBranch, branches, setSelectedBranch } = useBranch()
  const [isOpen, setIsOpen] = useState(false)

  if (branches.length === 0) {
    return null
  }

  if (branches.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
          H
        </div>
        <span className="text-sm font-medium text-gray-900">{branches[0].name}</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cx(
          "flex items-center gap-2 rounded-md px-3 py-2",
          "hover:bg-gray-100 transition-colors"
        )}
      >
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
          H
        </div>
        <span className="text-sm font-medium text-gray-900">
          {selectedBranch?.name || 'Seleccionar sucursal'}
        </span>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-64 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => {
                    setSelectedBranch(branch)
                    setIsOpen(false)
                  }}
                  className={cx(
                    "w-full text-left px-4 py-2 text-sm",
                    selectedBranch?.id === branch.id
                      ? "bg-blue-50 text-blue-900"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {branch.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

