<script setup lang="ts">
import { useTabStore } from '@/stores/tabs'
import { X, FileCode, Table2, Activity, Cpu, HardDrive } from '@lucide/vue'
import SqlEditor from '@/components/editor/SqlEditor.vue'
import ResultGrid from '@/components/grid/ResultGrid.vue'
import ExecutionPlanVisualizer from '@/components/explain/ExecutionPlanVisualizer.vue'
import SessionBrowser from '@/components/session/SessionBrowser.vue'
import StorageManager from '@/components/storage/StorageManager.vue'

const tabStore = useTabStore()

const tabIcons: Record<string, unknown> = {
  'sql-editor': FileCode,
  'table-viewer': Table2,
  'execution-plan': Cpu,
  'session-browser': Activity,
  'storage-manager': HardDrive
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Tab bar -->
    <div class="flex items-end border-b border-border bg-card overflow-x-auto flex-shrink-0 h-8" style="scrollbar-width: none">
      <div
        v-for="tab in tabStore.tabs"
        :key="tab.id"
        class="group flex items-center gap-1.5 px-3 h-full cursor-pointer border-r border-border text-xs select-none flex-shrink-0 max-w-[180px]"
        :class="tab.id === tabStore.activeTabId
          ? 'bg-background text-foreground border-t-2 border-t-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'"
        @click="tabStore.setActiveTab(tab.id)"
      >
        <component :is="tabIcons[tab.type] ?? FileCode" :size="11" class="flex-shrink-0" />
        <span class="truncate">{{ tab.title }}</span>
        <span v-if="tab.isDirty" class="text-amber-400 text-[10px] leading-none">●</span>
        <button
          class="ml-auto opacity-0 group-hover:opacity-100 hover:text-foreground rounded"
          @click.stop="tabStore.closeTab(tab.id)"
        >
          <X :size="10" />
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="tabStore.tabs.length === 0" class="flex items-center px-3 h-full text-xs text-muted-foreground/40">
        No open tabs
      </div>
    </div>

    <!-- Tab content -->
    <div class="flex-1 overflow-hidden">
      <template v-for="tab in tabStore.tabs" :key="tab.id">
        <div v-show="tab.id === tabStore.activeTabId" class="h-full w-full">
          <SqlEditor v-if="tab.type === 'sql-editor'" :tab-id="tab.id" :connection-id="tab.connectionId!" />
          <ResultGrid v-else-if="tab.type === 'table-viewer'" :tab-id="tab.id" :connection-id="tab.connectionId!" :data="tab.data as { schema: string; table: string }" />
          <ExecutionPlanVisualizer v-else-if="tab.type === 'execution-plan'" :plan="tab.data as unknown[]" />
          <SessionBrowser v-else-if="tab.type === 'session-browser'" :connection-id="tab.connectionId!" />
          <StorageManager v-else-if="tab.type === 'storage-manager'" :connection-id="tab.connectionId!" />
        </div>
      </template>

      <!-- Welcome screen -->
      <div v-if="tabStore.tabs.length === 0" class="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="opacity-20"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
        <div class="text-center">
          <p class="text-sm font-medium">NexaSQL</p>
          <p class="text-xs mt-1 opacity-60">Connect to a database to get started</p>
          <p class="text-xs mt-3 opacity-40">⌘⇧P — Command Palette</p>
        </div>
      </div>
    </div>
  </div>
</template>
