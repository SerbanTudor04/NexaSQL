<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import CommandPalette from '@/components/common/CommandPalette.vue'
import { useConnectionStore } from '@/stores/connections'
import { useUIStore } from '@/stores/ui'

const connectionStore = useConnectionStore()
const uiStore = useUIStore()

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
    e.preventDefault()
    uiStore.commandPaletteOpen = !uiStore.commandPaletteOpen
  }
  if (e.key === 'Escape') {
    uiStore.commandPaletteOpen = false
  }
}

onMounted(() => {
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
  </div>
</template>
