'use client'

import { ReactNode } from 'react'
import { Tabs as AriaTabs, TabList, Tab, TabPanel } from 'react-aria-components'
import { cx } from '@/lib/utils/cx'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  defaultSelectedKey?: string
  className?: string
  onChange?: (key: string) => void
}

export function Tabs({ tabs, defaultSelectedKey, className, onChange }: TabsProps) {
  return (
    <AriaTabs
      className={cx('flex flex-col', className)}
      defaultSelectedKey={defaultSelectedKey || tabs[0]?.id}
      onSelectionChange={(key) => onChange?.(key as string)}
    >
      <TabList className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            isDisabled={tab.disabled}
            className={cx(
              'cursor-pointer border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-500',
              'hover:border-gray-300 hover:text-gray-700',
              'focus:outline-none',
              'selected:border-primary-500 selected:text-primary-600',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>
      {tabs.map((tab) => (
        <TabPanel
          key={tab.id}
          id={tab.id}
          className="mt-4 focus:outline-none"
        >
          {tab.content}
        </TabPanel>
      ))}
    </AriaTabs>
  )
}
