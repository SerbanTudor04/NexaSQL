import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tab, TabType } from '@/types'
import { generateId } from '@/lib/utils'

export const useTabStore = defineStore('tabs', () => {
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string | null>(null)

  const activeTab = computed(() => tabs.value.find((t) => t.id === activeTabId.value) ?? null)

  function openTab(tab: Omit<Tab, 'id'>): string {
    const id = generateId()
    tabs.value.push({ ...tab, id })
    activeTabId.value = id
    return id
  }

  function closeTab(id: string) {
    const idx = tabs.value.findIndex((t) => t.id === id)
    tabs.value = tabs.value.filter((t) => t.id !== id)

    if (activeTabId.value === id) {
      if (tabs.value.length === 0) {
        activeTabId.value = null
      } else if (idx > 0) {
        activeTabId.value = tabs.value[idx - 1].id
      } else {
        activeTabId.value = tabs.value[0].id
      }
    }
  }

  function setActiveTab(id: string) {
    activeTabId.value = id
  }

  function updateTab(id: string, updates: Partial<Tab>) {
    const tab = tabs.value.find((t) => t.id === id)
    if (tab) Object.assign(tab, updates)
  }

  function openSqlEditor(connectionId: string) {
    return openTab({
      type: 'sql-editor' as TabType,
      title: 'SQL Worksheet',
      connectionId,
      isDirty: false
    })
  }

  function openTableViewer(connectionId: string, schema: string, table: string) {
    return openTab({
      type: 'table-viewer' as TabType,
      title: `${schema}.${table}`,
      connectionId,
      data: { schema, table }
    })
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    openTab,
    closeTab,
    setActiveTab,
    updateTab,
    openSqlEditor,
    openTableViewer
  }
})
