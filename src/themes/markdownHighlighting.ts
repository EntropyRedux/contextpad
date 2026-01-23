import { Extension } from '@codemirror/state'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

/**
 * VS Code-style markdown syntax highlighting
 * Includes visual rendering (bold, italic, sizes) for better readability
 * NOTE: Visual rendering applies globally - context-aware rendering deferred to Live Preview
 */
export const markdownHighlighting: Extension = syntaxHighlighting(
  HighlightStyle.define([
    // Headings - VS Code blue color with sizing
    { tag: tags.heading1, color: '#569cd6', fontWeight: 'bold', fontSize: '1.5em' },
    { tag: tags.heading2, color: '#569cd6', fontWeight: 'bold', fontSize: '1.3em' },
    { tag: tags.heading3, color: '#569cd6', fontWeight: 'bold', fontSize: '1.2em' },
    { tag: tags.heading4, color: '#569cd6', fontWeight: 'bold', fontSize: '1.1em' },
    { tag: tags.heading5, color: '#569cd6', fontWeight: 'bold' },
    { tag: tags.heading6, color: '#569cd6', fontWeight: 'bold' },

    // Emphasis - with visual styling
    { tag: tags.emphasis, color: '#d4d4d4', fontStyle: 'italic' },
    { tag: tags.strong, color: '#d4d4d4', fontWeight: 'bold' },
    { tag: tags.strikethrough, color: '#858585', textDecoration: 'line-through' },

    // Links
    { tag: tags.link, color: '#3794ff' },
    { tag: tags.url, color: '#3794ff' },

    // Inline code - distinct color
    { tag: tags.monospace, color: '#ce9178' },

    // Code fence markers (```)
    { tag: tags.contentSeparator, color: '#858585' },

    // Lists
    // Lists - use theme default color
    { tag: tags.list },

    // Quotes
    { tag: tags.quote, color: '#608b4e' },

    // Horizontal rules
    { tag: tags.processingInstruction, color: '#858585' },
  ])
)
