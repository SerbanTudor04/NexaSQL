<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
import { Database, FolderTree } from '@lucide/vue'
import ConnectionList from '@/components/connection/ConnectionList.vue'
import ObjectExplorer from '@/components/explorer/ObjectExplorer.vue'

const uiStore = useUIStore()
</script>

<template>
  <div class="flex h-full flex-col bg-card">
    <!-- Panel tabs -->
    <div class="flex border-b border-border flex-shrink-0">
      <button
        v-for="panel in [
          { id: 'connections', icon: Database, label: 'Connections' },
          { id: 'explorer', icon: FolderTree, label: 'Explorer' }
        ]"
        :key="panel.id"
        class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-b-2"
        :class="uiStore.activeLeftPanel === panel.id
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="uiStore.activeLeftPanel = panel.id as 'connections' | 'explorer'"
      >
        <component :is="panel.icon" :size="12" />
        {{ panel.label }}
      </button>
    </div>

    <div class="flex-1 overflow-hidden">
      <ConnectionList v-if="uiStore.activeLeftPanel === 'connections'" />
      <ObjectExplorer v-else />
    </div>
  </div>
</template>
