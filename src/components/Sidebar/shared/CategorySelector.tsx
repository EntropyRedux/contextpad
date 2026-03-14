import { useState, useMemo } from 'react'
import { Plus, X, ChevronDown } from 'lucide-react'
import styles from './SidebarManager.module.css'

interface CategorySelectorProps {
  value: string
  categories: { name: string; count: number }[] | string[]
  onChange: (value: string) => void
  placeholder?: string
}

export function CategorySelector({ value, categories, onChange, placeholder = "Category" }: CategorySelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const categoryNames = useMemo(() => {
    return categories.map(c => typeof c === 'string' ? c : c.name)
  }, [categories])

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === '___NEW___') {
      setIsAddingNew(true)
      setCustomValue('')
    } else {
      onChange(val)
    }
  }

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim().toUpperCase())
    }
    setIsAddingNew(false)
  }

  const handleCancelCustom = () => {
    setIsAddingNew(false)
  }

  if (isAddingNew) {
    return (
      <div className={styles.customCategoryRow}>
        <input
          className={styles.input}
          autoFocus
          placeholder="New category name..."
          value={customValue}
          onChange={e => setCustomValue(e.target.value.toUpperCase())}
          onKeyDown={e => {
            if (e.key === 'Enter') handleCustomSubmit()
            if (e.key === 'Escape') handleCancelCustom()
          }}
        />
        <button className={styles.smallIconBtn} onClick={handleCustomSubmit} title="Add">
          <Plus size={14} />
        </button>
        <button className={styles.smallIconBtn} onClick={handleCancelCustom} title="Cancel">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className={styles.selectWrapper}>
      <select 
        className={styles.select} 
        value={value} 
        onChange={handleSelectChange}
      >
        <option value="" disabled>{placeholder}</option>
        {categoryNames.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
        <option value="___NEW___">+ NEW CATEGORY...</option>
      </select>
      <div className={styles.selectChevron}>
        <ChevronDown size={14} />
      </div>
    </div>
  )
}
