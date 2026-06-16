<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import CommandPalette from '@/components/common/CommandPalette.vue'
import OracleSetupWizard from '@/components/setup/OracleSetupWizard.vue'
import { useConnectionStore } from '@/stores/connections'
import { useUIStore } from '@/stores/ui'
import { useSetupStore } from '@/stores/setup'

const connectionStore = useConnectionStore()
const uiStore = useUIStore()
const setupStore = useSetupStore()

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
    e.preventDefault()
    uiStore.commandPaletteOpen = !uiStore.commandPaletteOpen
  }
  if (e.key === 'Escape') {
    uiStore.commandPaletteOpen = false
  }
}

onMounted(async () => {
  await setupStore.load()
  connectionStore.loadConnections()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col">
    <AppLayout />
    <CommandPalette v-if="uiStore.commandPaletteOpen" />
    <OracleSetupWizard
      v-if="setupStore.loaded && !setupStore.setupDone"
      @done="setupStore.setupDone = true"
    />
  </div>
</template>
