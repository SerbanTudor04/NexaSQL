<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RefreshCw } from '@lucide/vue'
import Button from '@/components/ui/button/Button.vue'
import type { StorageStat } from '@/types'

const props = defineProps<{ connectionId: string }>()

const stats = ref<StorageStat[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const result = await window.nexasql.schema.getStorageStats(props.connectionId) as { success: boolean; stats: StorageStat[] }
    if (result.success) stats.value = result.stats
  } finally {
    loading.value = false
  }
}

const maxBytes = computed(() => Math.max(...stats.value.map((s) => s.total_bytes), 1))

function pct(bytes: number) {
  return Math.max(2, (bytes / maxBytes.value) * 100)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center gap-2 px-3 py-1.5 border-b border-border flex-shrink-0">
      <span class="text-xs font-medium">Storage Analysis</span>
      <div class="flex-1" />
      <Button variant="ghost" size="icon" :disabled="loading" @click="load">
        <RefreshCw :size="12" :class="{ 'animate-spin': loading }" />
      </Button>
    </div>

    <div class="flex-1 overflow-auto p-3">
      <div class="space-y-2">
        <div v-if="loading" class="text-xs text-muted-foreground p-4">Loading storage stats…</div>

        <div
          v-for="stat in stats"
          :key="`${stat.schemaname}.${stat.tablename}`"
          class="rounded border border-border p-2 hover:bg-accent/20 transition-colors"
        >
          <div class="flex items-center justify-between mb-1.5">
            <div>
              <span class="text-xs font-medium">{{ stat.tablename }}</span>
              <span class="text-[10px] text-muted-foreground ml-1">{{ stat.schemaname }}</span>
            </div>
            <span class="text-xs text-muted-foreground">{{ stat.total_pretty }}</span>
          </div>

          <!-- Stacked bar -->
          <div class="h-2 w-full rounded-full bg-secondary flex overflow-hidden">
            <div
              class="bg-sky-500 transition-all"
              :style="`width: ${pct(stat.table_bytes)}%`"
              :title="`Table data: ${formatBytes(stat.table_bytes)}`"
            />
            <div
              class="bg-purple-500 transition-all"
              :style="`width: ${pct(stat.index_bytes)}%`"
              :title="`Indexes: ${formatBytes(stat.index_bytes)}`"
            />
          </div>

          <div class="flex gap-4 mt-1">
            <span class="text-[10px] text-muted-foreground flex items-center gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-sky-500 flex-shrink-0" />
              Data {{ formatBytes(stat.table_bytes) }}
            </span>
            <span class="text-[10px] text-muted-foreground flex items-center gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
              Indexes {{ formatBytes(stat.index_bytes) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
