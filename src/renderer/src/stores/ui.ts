import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const leftSidebarWidth = ref(280)
  const bottomPanelHeight = ref(220)
  const leftSidebarCollapsed = ref(false)
  const bottomPanelCollapsed = ref(false)
  const commandPaletteOpen = ref(false)
  const activeLeftPanel = ref<'connections' | 'explorer'>('connections')

  function setLeftSidebarWidth(w: number) {
    leftSidebarWidth.value = Math.max(180, Math.min(600, w))
  }
  function setBottomPanelHeight(h: number) {
    bottomPanelHeight.value = Math.max(100, Math.min(600, h))
  }
  function toggleLeftSidebar() {
    leftSidebarCollapsed.value = !leftSidebarCollapsed.value
  }
  function toggleBottomPanel() {
    bottomPanelCollapsed.value = !bottomPanelCollapsed.value
  }

  return {
    leftSidebarWidth,
    bottomPanelHeight,
    leftSidebarCollapsed,
    bottomPanelCollapsed,
    commandPaletteOpen,
    activeLeftPanel,
    setLeftSidebarWidth,
    setBottomPanelHeight,
    toggleLeftSidebar,
    toggleBottomPanel
  }
})
