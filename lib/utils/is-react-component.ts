import { ComponentType, isValidElement } from 'react'

export function isReactComponent(component: unknown): component is ComponentType {
  return (
    typeof component === 'function' ||
    (typeof component === 'object' && component !== null && isValidElement(component))
  )
}

