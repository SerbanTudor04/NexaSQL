<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { ColumnInfo } from '@/types'

const props = defineProps<{
  columns: ColumnInfo[]
  rows: unknown[][]
  tabId?: string
  connectionId?: string
  data?: { schema: string; table: string }
}>()

const parentRef = ref<HTMLDivElement | null>(null)
const COL_MIN = 80
const COL_DEFAULT = 140
const ROW_HEIGHT = 24

const colWidths = ref<number[]>([])

onMounted(() => {
  colWidths.value = props.columns.map(() => COL_DEFAULT)
})

const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: props.rows.length,
    getScrollElement: () => parentRef.value,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20
  }))
)

const totalHeight = computed(() => rowVirtualizer.value.getTotalSize())
const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems())

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function isCellNull(value: unknown): boolean {
  return value === null || value === undefined
}

// Column resize
let resizingCol = -1
let resizeStartX = 0
let resizeStartW = 0

function startColResize(e: MouseEvent, colIdx: number) {
  e.preventDefault()
  resizingCol = colIdx
  resizeStartX = e.clientX
  resizeStartW = colWidths.value[colIdx]

  const onMove = (e: MouseEvent) => {
    if (resizingCol < 0) return
    colWidths.value[resizingCol] = Math.max(COL_MIN, resizeStartW + e.clientX - resizeStartX)
  }
  const onUp = () => {
    resizingCol = -1
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

const totalWidth = computed(() => colWidths.value.reduce((a, b) => a + b, 0))
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="flex flex-shrink-0 border-b border-border overflow-x-auto" style="scrollbar-width: none">
      <div :style="`min-width: ${totalWidth}px; display: flex`">
        <!-- Row number header -->
        <div class="result-header-cell w-10 flex-shrink-0 text-right text-muted-foreground/40">#</div>

        <div
          v-for="(col, i) in columns"
          :key="col.name"
          class="result-header-cell relative flex-shrink-0 group"
          :style="`width: ${colWidths[i] ?? COL_DEFAULT}px`"
        >
          <span class="truncate block">{{ col.name }}</span>
          <span class="text-muted-foreground/40 text-[9px] truncate block leading-none">{{ col.dataType }}</span>
          <!-- Resize handle -->
          <div
            class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/60 opacity-0 group-hover:opacity-100"
            @mousedown.stop="startColResize($event, i)"
          />
        </div>
      </div>
    </div>

    <!-- Rows -->
    <div ref="parentRef" class="flex-1 overflow-auto">
      <div :style="`height: ${totalHeight}px; min-width: ${totalWidth}px; position: relative`">
        <div
          v-for="vRow in virtualRows"
          :key="vRow.key"
          class="flex absolute top-0 left-0 right-0 border-b border-border hover:bg-accent/30 transition-colors group"
          :style="`transform: translateY(${vRow.start}px); height: ${ROW_HEIGHT}px`"
        >
          <!-- Row number -->
          <div class="result-cell w-10 flex-shrink-0 text-right text-muted-foreground/30 border-r border-border">
            {{ vRow.index + 1 }}
          </div>

          <div
            v-for="(col, ci) in columns"
            :key="col.name"
            class="result-cell flex-shrink-0"
            :style="`width: ${colWidths[ci] ?? COL_DEFAULT}px`"
            :class="{
              'text-muted-foreground/40 italic': isCellNull(rows[vRow.index]?.[ci]),
              'text-sky-300': typeof rows[vRow.index]?.[ci] === 'number',
              'text-amber-300': typeof rows[vRow.index]?.[ci] === 'boolean'
            }"
          >
            {{ formatCell(rows[vRow.index]?.[ci]) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center px-2 h-5 border-t border-border flex-shrink-0 text-[10px] text-muted-foreground/60">
      {{ rows.length.toLocaleString() }} rows · {{ columns.length }} columns
    </div>
  </div>
</template>
