<script setup lang="ts">
import { computed } from 'vue'
import { useConnectionStore } from '@/stores/connections'
import { Play, Square, Zap, AlignLeft, Download, ChevronDown } from '@lucide/vue'
import Button from '@/components/ui/button/Button.vue'
import Tooltip from '@/components/ui/tooltip/Tooltip.vue'
import type { QueryResult } from '@/types'

const props = defineProps<{
  running: boolean
  connectionId: string
  result: QueryResult | null
}>()

const emit = defineEmits<{
  run: []
  explain: []
  format: []
  cancel: []
}>()

const connectionStore = useConnectionStore()
const connected = computed(() => connectionStore.isConnected(props.connectionId))
const conn = computed(() => connectionStore.connections.find((c) => c.id === props.connectionId))

function exportCsv() {
  if (!props.result?.columns || !props.result.rows) return
  const headers = props.result.columns.map((c) => c.name).join(',')
  const rows = props.result.rows.map((r) => (r as unknown[]).map((v) => {
    if (v === null) return 'NULL'
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }).join(','))
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nexasql_export.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportJson() {
  if (!props.result?.columns || !props.result.rows) return
  const cols = props.result.columns.map((c) => c.name)
  const data = props.result.rows.map((r) => Object.fromEntries(cols.map((c, i) => [c, (r as unknown[])[i]])))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nexasql_export.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex items-center gap-1 px-2 py-1 border-b border-border bg-card flex-shrink-0 h-8">
    <!-- Connection indicator -->
    <div class="flex items-center gap-1.5 mr-2 text-xs">
      <span class="h-1.5 w-1.5 rounded-full" :class="connected ? 'bg-emerald-400' : 'bg-muted-foreground/30'" />
      <span class="text-muted-foreground truncate max-w-[120px]">{{ conn?.name ?? 'Not connected' }}</span>
    </div>

    <div class="w-px h-4 bg-border mx-1" />

    <Tooltip content="Run (Ctrl+Enter)">
      <Button
        variant="ghost"
        size="icon"
        :disabled="running || !connected"
        class="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
        @click="$emit('run')"
      >
        <Play :size="13" />
      </Button>
    </Tooltip>

    <Tooltip v-if="running" content="Cancel query">
      <Button variant="ghost" size="icon" class="text-red-400 hover:text-red-300" @click="$emit('cancel')">
        <Square :size="13" />
      </Button>
    </Tooltip>

    <Tooltip content="Explain Plan (Ctrl+Shift+Enter)">
      <Button variant="ghost" size="icon" :disabled="running || !connected" @click="$emit('explain')">
        <Zap :size="13" />
      </Button>
    </Tooltip>

    <Tooltip content="Format SQL">
      <Button variant="ghost" size="icon" @click="$emit('format')">
        <AlignLeft :size="13" />
      </Button>
    </Tooltip>

    <div class="flex-1" />

    <!-- Export buttons (only when results exist) -->
    <template v-if="result?.columns">
      <Tooltip content="Export CSV">
        <Button variant="ghost" size="sm" @click="exportCsv">
          <Download :size="11" class="mr-1" /> CSV
        </Button>
      </Tooltip>
      <Tooltip content="Export JSON">
        <Button variant="ghost" size="sm" @click="exportJson">
          <Download :size="11" class="mr-1" /> JSON
        </Button>
      </Tooltip>
    </template>
  </div>
</template>
