import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { EditorView } from '@codemirror/view'
import {
  SearchQuery,
  setSearchQuery,
  findNext,
  findPrevious,
  replaceNext,
  replaceAll,
  selectMatches
} from '@codemirror/search'
import {
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CaseSensitive,
  Regex,
  WholeWord,
  Replace,
  ReplaceAll
} from 'lucide-react'
import styles from './FloatingSearch.module.css'

interface FloatingSearchProps {
  view: EditorView
  onClose: () => void
  mode: 'find' | 'replace'
}

export const FloatingSearch: React.FC<FloatingSearchProps> = ({ view, onClose: onCloseProp, mode: initialMode }) => {
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [matchCount, setMatchCount] = useState(0)
  const [currentMatch, setCurrentMatch] = useState(0)
  const [showReplace, setShowReplace] = useState(initialMode === 'replace')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Function to clear search state from CodeMirror
  const clearSearchState = () => {
    view.dispatch({
      effects: setSearchQuery.of(new SearchQuery({ search: '' }))
    })
  }

  // Wrap onClose to clear search state and restore editor focus
  const handleClose = () => {
    clearSearchState()
    view.focus()
    onCloseProp()
  }

  // Create portal container
  const [portalRoot] = useState(() => {
    const div = document.createElement('div')
    div.id = 'floating-search-portal'
    return div
  })

  useEffect(() => {
    document.body.appendChild(portalRoot)
    return () => {
      document.body.removeChild(portalRoot)
    }
  }, [portalRoot])

  // Cleanup search state on unmount (in case component is unmounted without handleClose)
  useEffect(() => {
    return () => {
      // Clear search highlights when component unmounts
      view.dispatch({
        effects: setSearchQuery.of(new SearchQuery({ search: '' }))
      })
    }
  }, [view])

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
    searchInputRef.current?.select()
  }, [])

  // Update CodeMirror search state whenever inputs change
  useEffect(() => {
    if (searchText) {
      try {
        const query = new SearchQuery({
          search: searchText,
          caseSensitive,
          regexp: useRegex,
          wholeWord
        })

        view.dispatch({
          effects: setSearchQuery.of(query)
        })

        // Update match count
        const text = view.state.doc.toString()
        let regex: RegExp

        if (useRegex) {
          regex = new RegExp(searchText, caseSensitive ? 'g' : 'gi')
        } else {
          // Escape special regex chars for plain text search
          let escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          if (wholeWord) {
            escaped = `\\b${escaped}\\b`
          }
          regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi')
        }

        const matches = text.match(regex)
        setMatchCount(matches?.length || 0)

        // Calculate current match index based on cursor position
        if (matches && matches.length > 0) {
          const cursorPos = view.state.selection.main.from
          let matchIndex = 0
          let pos = 0
          let match
          const searchRegex = new RegExp(regex.source, regex.flags.replace('g', ''))
          const globalRegex = new RegExp(regex.source, caseSensitive ? 'g' : 'gi')

          while ((match = globalRegex.exec(text)) !== null) {
            if (match.index >= cursorPos) {
              break
            }
            matchIndex++
          }
          setCurrentMatch(Math.min(matchIndex + 1, matches.length))
        } else {
          setCurrentMatch(0)
        }
      } catch (e) {
        // Handle invalid regex
        setMatchCount(0)
        setCurrentMatch(0)
      }
    } else {
      // Clear search query if text is empty
      view.dispatch({
        effects: setSearchQuery.of(new SearchQuery({ search: "" }))
      })
      setMatchCount(0)
      setCurrentMatch(0)
    }
  }, [searchText, caseSensitive, useRegex, wholeWord, view])

  const handleFindNext = () => {
    findNext(view)
    // Update current match after navigation
    setTimeout(() => {
      if (matchCount > 0) {
        setCurrentMatch(prev => prev < matchCount ? prev + 1 : 1)
      }
    }, 10)
  }

  const handleFindPrevious = () => {
    findPrevious(view)
    setTimeout(() => {
      if (matchCount > 0) {
        setCurrentMatch(prev => prev > 1 ? prev - 1 : matchCount)
      }
    }, 10)
  }

  const handleReplace = () => {
    // Set replace text in query before replacing
    const query = new SearchQuery({
      search: searchText,
      replace: replaceText,
      caseSensitive,
      regexp: useRegex,
      wholeWord
    })
    view.dispatch({ effects: setSearchQuery.of(query) })
    replaceNext(view)
  }

  const handleReplaceAll = () => {
    const query = new SearchQuery({
      search: searchText,
      replace: replaceText,
      caseSensitive,
      regexp: useRegex,
      wholeWord
    })
    view.dispatch({ effects: setSearchQuery.of(query) })
    replaceAll(view)
  }

  const handleSelectAll = () => {
    selectMatches(view)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        handleFindPrevious()
      } else {
        handleFindNext()
      }
    } else if (e.key === 'h' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      setShowReplace(prev => !prev)
    }
  }

  const content = (
    <div className={styles.floatingSearch} onKeyDown={handleKeyDown}>
      {/* Toggle replace row button */}
      <button
        className={styles.toggleReplace}
        onClick={() => setShowReplace(prev => !prev)}
        title={showReplace ? "Hide Replace" : "Show Replace (Ctrl+H)"}
      >
        <ChevronRight size={14} className={showReplace ? styles.rotated : ''} />
      </button>

      <div className={styles.searchContent}>
        {/* Find row */}
        <div className={styles.searchRow}>
          <div className={styles.inputWrapper}>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Find"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <div className={styles.inputOptions}>
              <button
                className={`${styles.optionBtn} ${caseSensitive ? styles.active : ''}`}
                onClick={() => setCaseSensitive(prev => !prev)}
                title="Match Case (Alt+C)"
              >
                <CaseSensitive size={14} />
              </button>
              <button
                className={`${styles.optionBtn} ${wholeWord ? styles.active : ''}`}
                onClick={() => setWholeWord(prev => !prev)}
                title="Match Whole Word (Alt+W)"
              >
                <WholeWord size={14} />
              </button>
              <button
                className={`${styles.optionBtn} ${useRegex ? styles.active : ''}`}
                onClick={() => setUseRegex(prev => !prev)}
                title="Use Regular Expression (Alt+R)"
              >
                <Regex size={14} />
              </button>
            </div>
          </div>

          <div className={styles.matchInfo}>
            {searchText && (
              <span className={styles.matchCount}>
                {matchCount === 0 ? 'No results' : `${currentMatch} of ${matchCount}`}
              </span>
            )}
          </div>

          <div className={styles.navButtons}>
            <button
              className={styles.navBtn}
              onClick={handleFindPrevious}
              disabled={!searchText || matchCount === 0}
              title="Previous Match (Shift+Enter)"
            >
              <ChevronUp size={16} />
            </button>
            <button
              className={styles.navBtn}
              onClick={handleFindNext}
              disabled={!searchText || matchCount === 0}
              title="Next Match (Enter)"
            >
              <ChevronDown size={16} />
            </button>
            <button
              className={styles.navBtn}
              onClick={handleSelectAll}
              disabled={!searchText || matchCount === 0}
              title="Select All Matches"
            >
              <span className={styles.selectAllIcon}>⊞</span>
            </button>
            <button
              className={styles.closeBtn}
              onClick={handleClose}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Replace row */}
        {showReplace && (
          <div className={styles.replaceRow}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Replace"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
              />
            </div>

            <div className={styles.replaceButtons}>
              <button
                className={styles.replaceBtn}
                onClick={handleReplace}
                disabled={!searchText || matchCount === 0}
                title="Replace (Ctrl+Shift+1)"
              >
                <Replace size={14} />
              </button>
              <button
                className={styles.replaceBtn}
                onClick={handleReplaceAll}
                disabled={!searchText || matchCount === 0}
                title="Replace All (Ctrl+Shift+Enter)"
              >
                <ReplaceAll size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, portalRoot)
}
