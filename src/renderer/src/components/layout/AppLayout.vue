<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import TitleBar from './TitleBar.vue'
import Sidebar from './Sidebar.vue'
import TabWorkspace from './TabWorkspace.vue'
import BottomPanel from './BottomPanel.vue'

const uiStore = useUIStore()
const isResizingSidebar = ref(false)
const isResizingBottom = ref(false)

const sidebarStyle = computed(() =>
  uiStore.leftSidebarCollapsed
    ? 'width: 0px; overflow: hidden'
    : `width: ${uiStore.leftSidebarWidth}px; min-width: ${uiStore.leftSidebarWidth}px`
)

const bottomStyle = computed(() =>
  uiStore.bottomPanelCollapsed
    ? 'height: 0px; overflow: hidden'
    : `height: ${uiStore.bottomPanelHeight}px`
)

function startSidebarResize(e: MouseEvent) {
  isResizingSidebar.value = true
  const startX = e.clientX
  const startW = uiStore.leftSidebarWidth

  const onMove = (e: MouseEvent) => {
    uiStore.setLeftSidebarWidth(startW + e.clientX - startX)
  }
  const onUp = () => {
    isResizingSidebar.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function startBottomResize(e: MouseEvent) {
  isResizingBottom.value = true
  const startY = e.clientY
  const startH = uiStore.bottomPanelHeight

  const onMove = (e: MouseEvent) => {
    uiStore.setBottomPanelHeight(startH - (e.clientY - startY))
  }
  const onUp = () => {
    isResizingBottom.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<template>
  <div class="flex flex-col h-screen">
    <TitleBar />
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar -->
      <div class="flex-shrink-0 border-r border-border overflow-hidden transition-[width] duration-150" :style="sidebarStyle">
        <Sidebar />
      </div>

      <!-- Sidebar resize handle -->
      <div
        v-if="!uiStore.leftSidebarCollapsed"
        class="w-1 cursor-col-resize hover:bg-primary/40 transition-colors flex-shrink-0"
        :class="{ 'bg-primary/60': isResizingSidebar }"
        @mousedown="startSidebarResize"
      />

      <!-- Main content area -->
      <div class="flex flex-col flex-1 overflow-hidden">
        <TabWorkspace class="flex-1 overflow-hidden" />

        <!-- Bottom resize handle -->
        <div
          v-if="!uiStore.bottomPanelCollapsed"
          class="h-1 cursor-row-resize hover:bg-primary/40 transition-colors flex-shrink-0"
          :class="{ 'bg-primary/60': isResizingBottom }"
          @mousedown="startBottomResize"
        />

        <!-- Bottom Panel -->
        <div
          class="flex-shrink-0 border-t border-border overflow-hidden transition-[height] duration-150"
          :style="bottomStyle"
        >
          <BottomPanel />
        </div>
      </div>
    </div>
  </div>
</template>
