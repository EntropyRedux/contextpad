import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionManager } from '../ActionManager'
import { useActionStore } from '../../../store/actionStore'

describe('ActionManager Component', () => {
  beforeEach(() => {
    useActionStore.getState().clearAllActions()
  })

  it('should render empty state when no actions exist', () => {
    render(<ActionManager />)
    expect(screen.getByText('No actions')).toBeInTheDocument()
  })

  it('should toggle the add action form', () => {
    render(<ActionManager />)

    const addBtn = screen.getByTitle('Add Action')
    fireEvent.click(addBtn)

    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
    expect(screen.getByText('Command')).toBeInTheDocument()
    expect(screen.getByText('Button')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByPlaceholderText('Name')).not.toBeInTheDocument()
  })

  it('should create an action through the form', () => {
    render(<ActionManager />)

    fireEvent.click(screen.getByTitle('Add Action'))

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Uppercase Selection' }
    })
    fireEvent.change(screen.getByPlaceholderText('Code'), {
      target: { value: 'UPPER(selection)' }
    })

    fireEvent.click(screen.getByText('Add'))

    expect(screen.getByText('Uppercase Selection')).toBeInTheDocument()
  })
})
