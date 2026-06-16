<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import { ChevronDown, Trash2 } from '@lucide/vue'
import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue'
import { useLogs } from '@/composables/useLogs'

const uiStore = useUIStore()
const { logs, clearLogs } = useLogs()

const levelClass: Record<string, string> = {
  info: 'text-muted-foreground',
  success: 'text-emerald-400',
  error: 'text-red-400',
  warning: 'text-amber-400'
}
</script>

<template>
  <div class="flex flex-col h-full bg-card">
    <div class="flex items-center justify-between px-3 py-1 border-b border-border flex-shrink-0">
      <span class="text-xs font-medium text-muted-foreground">Console</span>
      <div class="flex items-center gap-1">
        <button class="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground" @click="clearLogs">
          <Trash2 :size="11" />
        </button>
        <button class="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground" @click="uiStore.toggleBottomPanel">
          <ChevronDown :size="11" />
        </button>
      </div>
    </div>
    <ScrollArea class="flex-1">
      <div class="p-2 space-y-0.5 font-mono text-[11px]">
        <div v-for="entry in logs" :key="entry.id" class="flex gap-2">
          <span class="text-muted-foreground/50 flex-shrink-0">{{ entry.time }}</span>
          <span :class="levelClass[entry.level]">{{ entry.message }}</span>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>
