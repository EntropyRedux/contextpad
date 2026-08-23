import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkflowManager } from '../WorkflowManager'
import { useTabStore } from '../../../store/tabStore'

describe('WorkflowManager Component', () => {
  beforeEach(() => {
    // Reset pinned tabs to empty for predictable testing
    const store = useTabStore.getState()
    store.pinnedTabs.forEach(p => store.removePinnedTab(p.id))
  })

  it('should render empty state when no workflows exist', () => {
    render(<WorkflowManager />)
    expect(screen.getByText('No workflows or bookmarks')).toBeInTheDocument()
  })

  it('should open and close add workflow form', () => {
    render(<WorkflowManager />)

    const addBtn = screen.getByTitle('Add Workflow')
    fireEvent.click(addBtn)

    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
    expect(screen.getByText('Workflow')).toBeInTheDocument()
    expect(screen.getByText('Bookmark')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByPlaceholderText('Name')).not.toBeInTheDocument()
  })

  it('should add a workflow via form', () => {
    render(<WorkflowManager />)

    fireEvent.click(screen.getByTitle('Add Workflow'))

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Prompt Review Workflow' }
    })
    fireEvent.change(screen.getByPlaceholderText('Blueprint content...'), {
      target: { value: '# Workflow Instructions\n1. Analyze\n2. Optimize' }
    })

    fireEvent.click(screen.getByText('Create'))

    expect(screen.getByText('Prompt Review Workflow')).toBeInTheDocument()
  })
})
