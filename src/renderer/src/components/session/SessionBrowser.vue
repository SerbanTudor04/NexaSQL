<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RefreshCw, XCircle } from '@lucide/vue'
import Button from '@/components/ui/button/Button.vue'
import Badge from '@/components/ui/badge/Badge.vue'
import type { SessionInfo } from '@/types'

const props = defineProps<{ connectionId: string }>()

const sessions = ref<SessionInfo[]>([])
const loading = ref(false)
const autoRefresh = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | null = null

async function load() {
  loading.value = true
  try {
    const result = await window.nexasql.schema.getSessions(props.connectionId) as { success: boolean; sessions: SessionInfo[] }
    if (result.success) sessions.value = result.sessions
  } finally {
    loading.value = false
  }
}

async function killSession(pid: number) {
  await window.nexasql.schema.killSession(props.connectionId, pid)
  await load()
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    refreshTimer = setInterval(load, 5000)
  } else if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const stateVariant = (state: string): 'success' | 'warning' | 'destructive' | 'secondary' => {
  if (state === 'active') return 'success'
  if (state === 'idle in transaction') return 'warning'
  if (state === 'idle in transaction (aborted)') return 'destructive'
  return 'secondary'
}

onMounted(load)
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer) })
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center gap-2 px-3 py-1.5 border-b border-border flex-shrink-0">
      <span class="text-xs font-medium">Active Sessions</span>
      <Badge variant="secondary">{{ sessions.length }}</Badge>
      <div class="flex-1" />
      <Button variant="ghost" size="sm" :class="{ 'text-primary': autoRefresh }" @click="toggleAutoRefresh">
        Auto
      </Button>
      <Button variant="ghost" size="icon" :disabled="loading" @click="load">
        <RefreshCw :size="12" :class="{ 'animate-spin': loading }" />
      </Button>
    </div>

    <div class="flex-1 overflow-auto">
      <table class="w-full text-xs border-collapse">
        <thead>
          <tr class="bg-secondary text-muted-foreground">
            <th class="px-2 py-1.5 text-left border-b border-border font-medium w-12">PID</th>
            <th class="px-2 py-1.5 text-left border-b border-border font-medium">User</th>
            <th class="px-2 py-1.5 text-left border-b border-border font-medium">App</th>
            <th class="px-2 py-1.5 text-left border-b border-border font-medium w-28">State</th>
            <th class="px-2 py-1.5 text-left border-b border-border font-medium">Wait</th>
            <th class="px-2 py-1.5 text-left border-b border-border font-medium">Query</th>
            <th class="px-2 py-1.5 text-left border-b border-border font-medium w-8"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in sessions"
            :key="s.pid"
            class="border-b border-border hover:bg-accent/30 transition-colors"
          >
            <td class="px-2 py-1 font-mono text-muted-foreground">{{ s.pid }}</td>
            <td class="px-2 py-1">{{ s.username }}</td>
            <td class="px-2 py-1 text-muted-foreground truncate max-w-[100px]">{{ s.application_name || '—' }}</td>
            <td class="px-2 py-1">
              <Badge :variant="stateVariant(s.state)">{{ s.state }}</Badge>
            </td>
            <td class="px-2 py-1 text-muted-foreground text-[11px]">
              {{ s.wait_event ? `${s.wait_event_type}/${s.wait_event}` : '—' }}
            </td>
            <td class="px-2 py-1 max-w-[240px]">
              <span class="font-mono text-[11px] truncate block text-muted-foreground" :title="s.query ?? ''">
                {{ s.query || '—' }}
              </span>
            </td>
            <td class="px-2 py-1">
              <button
                class="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                title="Kill session"
                @click="killSession(s.pid)"
              >
                <XCircle :size="13" />
              </button>
            </td>
          </tr>
          <tr v-if="sessions.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-muted-foreground/50">No active sessions</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
