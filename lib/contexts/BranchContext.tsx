'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Branch = Database['public']['Tables']['branches']['Row']

interface BranchContextType {
  selectedBranch: Branch | null
  branches: Branch[]
  setSelectedBranch: (branch: Branch | null) => void
  loading: boolean
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadBranches() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get user profile to get funeral_home_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('funeral_home_id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        setLoading(false)
        return
      }

      // Get user's accessible branches
      const { data: userBranches } = await supabase
        .from('user_branches')
        .select('branch_id')
        .eq('user_id', user.id)

      const branchIds = userBranches?.map(ub => ub.branch_id) || []

      // Get branches
      const { data: branchesData } = await supabase
        .from('branches')
        .select('*')
        .eq('funeral_home_id', profile.funeral_home_id)
        .eq('is_active', true)
        .in('id', branchIds.length > 0 ? branchIds : ['00000000-0000-0000-0000-000000000000']) // Empty array workaround
        .order('name')

      if (branchesData) {
        setBranches(branchesData)
        
        // Try to restore selected branch from localStorage
        const savedBranchId = localStorage.getItem('selectedBranchId')
        if (savedBranchId && branchesData.find(b => b.id === savedBranchId)) {
          setSelectedBranchState(branchesData.find(b => b.id === savedBranchId) || null)
        } else if (branchesData.length > 0) {
          setSelectedBranchState(branchesData[0])
        }
      }
      
      setLoading(false)
    }

    loadBranches()
  }, [supabase])

  const setSelectedBranch = (branch: Branch | null) => {
    setSelectedBranchState(branch)
    if (branch) {
      localStorage.setItem('selectedBranchId', branch.id)
    } else {
      localStorage.removeItem('selectedBranchId')
    }
  }

  return (
    <BranchContext.Provider value={{ selectedBranch, branches, setSelectedBranch, loading }}>
      {children}
    </BranchContext.Provider>
  )
}

export function useBranch() {
  const context = useContext(BranchContext)
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider')
  }
  return context
}

