/**
 * Icon options for pinned tabs
 * 20 Lucide icons - 7 common + 13 unique (not used elsewhere in the app)
 */

export const PINNED_TAB_ICONS = [
  // Common (7)
  'FileText',
  'Code',
  'Zap',
  'Settings',
  'Star',
  'Folder',
  'File',
  // Unique (13)
  'Bookmark',
  'MessageSquare',
  'Terminal',
  'Database',
  'Globe',
  'Lightbulb',
  'Sparkles',
  'Rocket',
  'Target',
  'Layers',
  'Clock',
  'Tag',
  'Lock'
] as const

export type PinnedTabIcon = typeof PINNED_TAB_ICONS[number]

/**
 * Default icon for new pinned tabs
 */
export const DEFAULT_PINNED_TAB_ICON: PinnedTabIcon = 'FileText'
