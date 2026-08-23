import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TemplateManager } from '../TemplateManager'
import { useTemplateStore } from '../../../store/templateStore'

describe('TemplateManager Component', () => {
  beforeEach(() => {
    useTemplateStore.getState().clearAllTemplates()
  })

  it('should render empty state when no templates exist', () => {
    render(<TemplateManager />)
    expect(screen.getByText('No templates')).toBeInTheDocument()
  })

  it('should open and close the add template form', () => {
    render(<TemplateManager />)
    
    // Click Add button in toolbar
    const addBtn = screen.getByTitle('Add Template')
    fireEvent.click(addBtn)

    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Content')).toBeInTheDocument()

    // Click Cancel
    const cancelBtn = screen.getByText('Cancel')
    fireEvent.click(cancelBtn)

    expect(screen.queryByPlaceholderText('Name')).not.toBeInTheDocument()
  })

  it('should add a new template through the form', () => {
    render(<TemplateManager />)

    // Open form
    fireEvent.click(screen.getByTitle('Add Template'))

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'My Test Template' }
    })
    fireEvent.change(screen.getByPlaceholderText('Content'), {
      target: { value: 'Template content with {{SELECTION}}' }
    })

    // Submit
    fireEvent.click(screen.getByText('Add'))

    expect(screen.getByText('My Test Template')).toBeInTheDocument()
  })
})
