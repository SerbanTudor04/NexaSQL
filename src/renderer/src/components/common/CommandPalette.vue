<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useConnectionStore } from '@/stores/connections'
import { useTabStore } from '@/stores/tabs'
import { useUIStore } from '@/stores/ui'
import { Search, Database, FileCode, Activity, HardDrive } from '@lucide/vue'

const connectionStore = useConnectionStore()
const tabStore = useTabStore()
const uiStore = useUIStore()

const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const selectedIdx = ref(0)

interface Command {
  id: string
  label: string
  description?: string
  icon: unknown
  action: () => void
}

const baseCommands = computed<Command[]>(() => [
  ...connectionStore.connections.map((conn) => ({
    id: `connect-${conn.id}`,
    label: `Connect: ${conn.name}`,
    description: `${conn.type} · ${conn.host}:${conn.port}`,
    icon: Database,
    action: async () => {
      await connectionStore.connectTo(conn)
      tabStore.openSqlEditor(conn.id)
      close()
    }
  })),
  {
    id: 'new-sql',
    label: 'New SQL Worksheet',
    description: 'Open a blank SQL editor',
    icon: FileCode,
    action: () => {
      const id = connectionStore.activeConnectionId
      if (id) { tabStore.openSqlEditor(id); close() }
    }
  },
  {
    id: 'session-browser',
    label: 'Open Session Browser',
    description: 'View active database sessions',
    icon: Activity,
    action: () => {
      const id = connectionStore.activeConnectionId
      if (id) {
        tabStore.openTab({ type: 'session-browser', title: 'Sessions', connectionId: id })
        close()
      }
    }
  },
  {
    id: 'storage-manager',
    label: 'Open Storage Manager',
    description: 'Analyze table and index storage',
    icon: HardDrive,
    action: () => {
      const id = connectionStore.activeConnectionId
      if (id) {
        tabStore.openTab({ type: 'storage-manager', title: 'Storage', connectionId: id })
        close()
      }
    }
  }
])

const filtered = computed(() => {
  if (!query.value) return baseCommands.value
  const q = query.value.toLowerCase()
  return baseCommands.value.filter(
    (c) => c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
  )
})

function close() {
  uiStore.commandPaletteOpen = false
  query.value = ''
  selectedIdx.value = 0
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIdx.value = Math.min(selectedIdx.value + 1, filtered.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIdx.value = Math.max(selectedIdx.value - 1, 0)
  } else if (e.key === 'Enter') {
    filtered.value[selectedIdx.value]?.action()
  } else if (e.key === 'Escape') {
    close()
  }
}

onMounted(async () => {
  await nextTick()
  inputRef.value?.focus()
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" @click.self="close">
    <div class="bg-popover border border-border rounded-lg shadow-2xl w-full max-w-lg overflow-hidden">
      <!-- Search input -->
      <div class="flex items-center gap-2 px-3 border-b border-border">
        <Search :size="14" class="text-muted-foreground flex-shrink-0" />
        <input
          ref="inputRef"
          v-model="query"
          placeholder="Search commands, connections, tables…"
          class="flex-1 h-11 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          @keydown="onKeydown"
        />
        <kbd class="text-[10px] border border-border rounded px-1 py-0.5 text-muted-foreground/60">ESC</kbd>
      </div>

      <!-- Results -->
      <div class="overflow-y-auto max-h-80 py-1">
        <div v-if="filtered.length === 0" class="px-4 py-8 text-center text-sm text-muted-foreground/50">
          No commands found
        </div>

        <button
          v-for="(cmd, i) in filtered"
          :key="cmd.id"
          class="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
          :class="i === selectedIdx ? 'bg-accent text-foreground' : 'text-foreground/80 hover:bg-accent/50'"
          @mouseenter="selectedIdx = i"
          @click="cmd.action()"
        >
          <component :is="cmd.icon" :size="14" class="flex-shrink-0 text-muted-foreground" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium truncate">{{ cmd.label }}</p>
            <p v-if="cmd.description" class="text-[11px] text-muted-foreground/60 truncate">{{ cmd.description }}</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
