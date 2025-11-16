'use client'

import { BranchSelector } from './BranchSelector'

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <BranchSelector />
        </div>
        <div className="relative flex flex-1 items-center justify-end gap-x-4 sm:gap-x-6">
          {/* Add notifications or other header items here */}
        </div>
      </div>
    </header>
  )
}

