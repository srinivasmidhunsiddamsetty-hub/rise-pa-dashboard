// Minimal ambient types for react-simple-maps v3 (ships no types of its own).
declare module 'react-simple-maps' {
  import type { ComponentType, ReactNode, CSSProperties } from 'react'

  export interface GeographyShape {
    rsmKey: string
    id: string
    properties: Record<string, unknown> & { name: string }
  }

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: Record<string, unknown>
    width?: number
    height?: number
    style?: CSSProperties
    children?: ReactNode
  }
  export const ComposableMap: ComponentType<ComposableMapProps>

  export interface GeographiesProps {
    geography: string | object
    children: (args: { geographies: GeographyShape[] }) => ReactNode
  }
  export const Geographies: ComponentType<GeographiesProps>

  export interface GeographyStateStyle {
    [k: string]: CSSProperties
  }
  export interface GeographyProps {
    geography: GeographyShape
    tabIndex?: number
    onMouseEnter?: (e: React.MouseEvent) => void
    onMouseMove?: (e: React.MouseEvent) => void
    onMouseLeave?: (e: React.MouseEvent) => void
    onClick?: (e: React.MouseEvent) => void
    style?: { default?: CSSProperties; hover?: CSSProperties; pressed?: CSSProperties }
  }
  export const Geography: ComponentType<GeographyProps>

  export const ZoomableGroup: ComponentType<{ children?: ReactNode; [k: string]: unknown }>
  export const Marker: ComponentType<{ children?: ReactNode; [k: string]: unknown }>
}
