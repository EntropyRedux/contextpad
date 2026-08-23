/**
 * Type definitions for react-window
 * Provides proper TypeScript support for react-window components
 */

import { FixedSizeList as List } from 'react-window'

declare module 'react-window' {
  export interface FixedSizeListProps {
    // Basic props
    children: React.ReactElement | ((props: any) => React.ReactNode)
    height: number | string
    itemCount: number
    itemSize: number
    width: number | string
    
    // Optional props
    className?: string
    direction?: 'ltr' | 'rtl'
    innerElementType?: React.ElementType
    innerRef?: React.Ref<any>
    itemData?: any
    itemKey?: (index: number, data: any) => string | number
    layout?: 'vertical' | 'horizontal'
    onItemsRendered?: (props: { visibleStartIndex: number; visibleStopIndex: number; overscanStartIndex: number; overscanStopIndex: number }) => void
    onScroll?: (props: { scrollDirection: 'forward' | 'backward'; scrollOffset: number; scrollUpdateWasRequested: boolean }) => void
    overscanCount?: number
    style?: React.CSSProperties
    useIsScrolling?: boolean
  }

  export interface VariableSizeListProps {
    children: React.ReactElement | ((props: any) => React.ReactNode)
    estimatedItemSize: number
    height: number | string
    itemCount: number
    itemSize: (index: number) => number
    width: number | string
    
    // Optional props
    className?: string
    direction?: 'ltr' | 'rtl'
    innerElementType?: React.ElementType
    innerRef?: React.Ref<any>
    itemData?: any
    itemKey?: (index: number, data: any) => string | number
    layout?: 'vertical' | 'horizontal'
    onItemsRendered?: (props: { visibleStartIndex: number; visibleStopIndex: number; overscanStartIndex: number; overscanStopIndex: number }) => void
    onScroll?: (props: { scrollDirection: 'forward' | 'backward'; scrollOffset: number; scrollUpdateWasRequested: boolean }) => void
    overscanCount?: number
    style?: React.CSSProperties
    useIsScrolling?: boolean
  }

  export interface FixedSizeGridProps {
    children: (props: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => React.ReactNode
    columnCount: number
    columnWidth: number
    height: number | string
    rowCount: number
    rowHeight: number
    width: number | string
    
    // Optional props
    className?: string
    direction?: 'ltr' | 'rtl'
    innerElementType?: React.ElementType
    innerRef?: React.Ref<any>
    itemData?: any
    onItemsRendered?: (props: { visibleColumnStartIndex: number; visibleColumnStopIndex: number; visibleRowStartIndex: number; visibleRowStopIndex: number; overscanColumnStartIndex: number; overscanColumnStopIndex: number; overscanRowStartIndex: number; overscanRowStopIndex: number }) => void
    onScroll?: (props: { horizontalScrollDirection: 'forward' | 'backward'; horizontalScrollOffset: number; scrollLeft: number; scrollTop: number; scrollUpdateWasRequested: boolean; verticalScrollDirection: 'forward' | 'backward'; verticalScrollOffset: number }) => void
    overscanColumnCount?: number
    overscanRowCount?: number
    style?: React.CSSProperties
    useIsScrolling?: boolean
  }

  export const FixedSizeList: React.ComponentType<FixedSizeListProps>
  export const VariableSizeList: React.ComponentType<VariableSizeListProps>
  export const FixedSizeGrid: React.ComponentType<FixedSizeGridProps>
  export const VariableSizeGrid: React.ComponentType<FixedSizeGridProps>
}

// Re-export the main components with proper types
export const FixedSizeList = List
