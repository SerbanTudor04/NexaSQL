import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ConnectionConfig } from '@/types'

export const useConnectionStore = defineStore('connections', () => {
  const connections = ref<ConnectionConfig[]>([])
  const activeConnectionId = ref<string | null>(null)
  const connectedIds = ref<Set<string>>(new Set())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeConnection = computed(() =>
    connections.value.find((c) => c.id === activeConnectionId.value) ?? null
  )

  const isConnected = (id: string) => connectedIds.value.has(id)

  async function loadConnections() {
    if (!window.nexasql) return
    loading.value = true
    try {
      const list = await window.nexasql.connection.list()
      connections.value = list as ConnectionConfig[]
    } catch (err) {
      error.value = String(err)
    } finally {
      loading.value = false
    }
  }

  async function saveConnection(config: ConnectionConfig) {
    if (!window.nexasql) return
    const result = await window.nexasql.connection.save(config) as { success: boolean }
    if (result.success) await loadConnections()
    return result
  }

  async function deleteConnection(id: string) {
    if (!window.nexasql) return
    await window.nexasql.connection.delete(id)
    connections.value = connections.value.filter((c) => c.id !== id)
    connectedIds.value.delete(id)
    if (activeConnectionId.value === id) activeConnectionId.value = null
  }

  async function testConnection(config: ConnectionConfig): Promise<{ success: boolean; message: string }> {
    if (!window.nexasql) return { success: false, message: 'Preload bridge not available. Run inside Electron (npm run dev).' }
    try {
      return await window.nexasql.connection.test(config) as { success: boolean; message: string }
    } catch (err) {
      return { success: false, message: String(err) }
    }
  }

  async function connectTo(config: ConnectionConfig): Promise<{ success: boolean; message?: string }> {
    if (!window.nexasql) return { success: false, message: 'Run inside Electron (npm run dev).' }
    try {
      const result = await window.nexasql.connection.connect(config) as { success: boolean; message?: string }
      if (result.success) {
        connectedIds.value.add(config.id)
        activeConnectionId.value = config.id
      }
      return result
    } catch (err) {
      return { success: false, message: String(err) }
    }
  }

  async function disconnect(id: string) {
    if (!window.nexasql) return
    await window.nexasql.connection.disconnect(id)
    connectedIds.value.delete(id)
    if (activeConnectionId.value === id) activeConnectionId.value = null
  }

  return {
    connections,
    activeConnectionId,
    connectedIds,
    activeConnection,
    loading,
    error,
    isConnected,
    loadConnections,
    saveConnection,
    deleteConnection,
    testConnection,
    connectTo,
    disconnect
  }
})
