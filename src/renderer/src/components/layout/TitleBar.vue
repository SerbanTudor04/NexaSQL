<script setup lang="ts">
import { useConnectionStore } from '@/stores/connections'
import { useUIStore } from '@/stores/ui'
import { PanelLeft, Terminal } from '@lucide/vue'

const connectionStore = useConnectionStore()
const uiStore = useUIStore()
</script>

<template>
  <div class="h-9 flex items-center gap-2 px-3 border-b border-border bg-card flex-shrink-0 select-none" style="-webkit-app-region: drag">
    <!-- macOS traffic lights space -->
    <div class="w-16 flex-shrink-0" />

    <div class="flex items-center gap-1" style="-webkit-app-region: no-drag">
      <button
        class="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        @click="uiStore.toggleLeftSidebar"
      >
        <PanelLeft :size="14" />
      </button>
    </div>

    <div class="flex items-center gap-1.5 flex-shrink-0" style="-webkit-app-region: no-drag">
      <Terminal :size="14" class="text-primary" />
      <span class="text-xs font-semibold tracking-wide">NexaSQL</span>
    </div>

    <div class="flex-1" />

    <div class="flex items-center gap-2 text-xs text-muted-foreground" style="-webkit-app-region: no-drag">
      <span v-if="connectionStore.activeConnection" class="flex items-center gap-1">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {{ connectionStore.activeConnection.name }}
      </span>
      <kbd class="px-1.5 py-0.5 rounded border border-border text-muted-foreground/60 text-[10px]">⌘⇧P</kbd>
    </div>
  </div>
</template>
