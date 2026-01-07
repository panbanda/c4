import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { FormField } from './FormField'
import type { Element } from '../types/c4'

interface PropertyEditorProps {
  element: Element
}

export function PropertyEditor({ element }: PropertyEditorProps) {
  const updateElement = useStore((state) => state.updateElement)
  const saveChanges = useStore((state) => state.saveChanges)
  const discardChanges = useStore((state) => state.discardChanges)
  const pendingChanges = useStore((state) => state.pendingChanges)
  const selectElement = useStore((state) => state.selectElement)

  const changes = pendingChanges.get(element.id) || {}
  const currentElement = { ...element, ...changes }

  const [name, setName] = useState(currentElement.name)
  const [description, setDescription] = useState(currentElement.description || '')
  const [technology, setTechnology] = useState(
    'technology' in currentElement ? (currentElement.technology || []).join(', ') : ''
  )
  const [tags, setTags] = useState((currentElement.tags || []).join(', '))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(currentElement.name)
    setDescription(currentElement.description || '')
    setTechnology('technology' in currentElement ? (currentElement.technology || []).join(', ') : '')
    setTags((currentElement.tags || []).join(', '))
  }, [element.id, currentElement])

  const hasLocalChanges = () => {
    return (
      name !== element.name ||
      description !== (element.description || '') ||
      ('technology' in element && technology !== (element.technology || []).join(', ')) ||
      tags !== (element.tags || []).join(', ')
    )
  }

  const handleUpdate = () => {
    const updates: Record<string, any> = {}

    if (name !== element.name) {
      updates.name = name
    }
    if (description !== (element.description || '')) {
      updates.description = description
    }
    if ('technology' in element && technology !== (element.technology || '')) {
      updates.technology = technology
    }
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean)
    if (tags !== (element.tags || []).join(', ')) {
      updates.tags = tagArray
    }

    if (Object.keys(updates).length > 0) {
      updateElement(element.id, updates as Partial<Element>)
    }
  }

  const handleSave = async () => {
    handleUpdate()
    setSaving(true)
    try {
      await saveChanges()
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    discardChanges()
    selectElement(null)
  }

  const hasTechnology = element.type === 'container' || element.type === 'component'

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Edit Element</h2>
          <span className="text-xs text-slate-400 uppercase">{element.type}</span>
        </div>
        <button
          onClick={handleCancel}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <FormField
        label="Name"
        value={name}
        onChange={setName}
        onBlur={handleUpdate}
      />

      <FormField
        label="Description"
        value={description}
        onChange={setDescription}
        onBlur={handleUpdate}
        multiline
      />

      {hasTechnology && (
        <FormField
          label="Technology"
          value={technology}
          onChange={setTechnology}
          onBlur={handleUpdate}
        />
      )}

      <FormField
        label="Tags (comma-separated)"
        value={tags}
        onChange={setTags}
        onBlur={handleUpdate}
        placeholder="tag1, tag2, tag3"
      />

      <div className="flex gap-2 pt-4 border-t border-slate-700">
        <button
          onClick={handleSave}
          disabled={saving || !hasLocalChanges()}
          className="flex-1 px-4 py-2 bg-amber-600 text-white rounded font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded font-medium hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>

      {hasLocalChanges() && (
        <p className="text-xs text-amber-400">
          You have unsaved changes. Click Update to stage them, then Save to persist.
        </p>
      )}
    </div>
  )
}
