import { Extension } from '@codemirror/state'
import { Prec } from '@codemirror/state'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

// Neutral heading color used when accent override is off — ensures headings
// always have a distinct color regardless of which CM syntax theme is selected.
const HEADING_FALLBACK = '#569cd6'

/**
 * VS Code-style markdown syntax highlighting.
 * When accentOverridesHeadings=true, uses Prec.highest so the accent color
 * wins over any CM theme's own heading color definition.
 * When false, uses a neutral fallback so headings are always styled.
 */
export function createMarkdownHighlighting(accentOverridesHeadings: boolean): Extension {
  const headingColor = accentOverridesHeadings ? 'var(--accent)' : HEADING_FALLBACK

  const style = syntaxHighlighting(
    HighlightStyle.define([
      // Headings — color is either accent or neutral fallback
      { tag: tags.heading1, color: headingColor, fontWeight: 'bold', fontSize: '1.5em' },
      { tag: tags.heading2, color: headingColor, fontWeight: 'bold', fontSize: '1.3em' },
      { tag: tags.heading3, color: headingColor, fontWeight: 'bold', fontSize: '1.2em' },
      { tag: tags.heading4, color: headingColor, fontWeight: 'bold', fontSize: '1.1em' },
      { tag: tags.heading5, color: headingColor, fontWeight: 'bold' },
      { tag: tags.heading6, color: headingColor, fontWeight: 'bold' },

      // Emphasis - with visual styling
      { tag: tags.emphasis, color: '#d4d4d4', fontStyle: 'italic' },
      { tag: tags.strong, color: '#d4d4d4', fontWeight: 'bold' },
      { tag: tags.strikethrough, color: '#858585', textDecoration: 'line-through' },

      // Links
      { tag: tags.link, color: '#3794ff' },
      { tag: tags.url, color: '#3794ff' },

      // Inline code - distinct color
      { tag: tags.monospace, color: '#ce9178' },

      // Lists - use theme default color
      { tag: tags.list },

      // Quotes
      { tag: tags.quote, color: '#608b4e' },
    ])
  )

  // When accent overrides headings, elevate priority so our color beats
  // any heading color defined by the active CM syntax theme.
  return accentOverridesHeadings ? Prec.highest(style) : style
}
