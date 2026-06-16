<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useConnectionStore } from '@/stores/connections'
import { useTabStore } from '@/stores/tabs'
import { RefreshCw, Search, ChevronRight, ChevronDown, Table2, Eye, Code2, ListOrdered, Database } from '@lucide/vue'
import Input from '@/components/ui/input/Input.vue'
import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue'
import type { SchemaNode } from '@/types'

const connectionStore = useConnectionStore()
const tabStore = useTabStore()

const tree = ref<SchemaNode[]>([])
const loading = ref(false)
const search = ref('')
const expanded = ref<Set<string>>(new Set())

const activeConnectionId = computed(() => connectionStore.activeConnectionId)

watch(activeConnectionId, async (id) => {
  if (id) await loadTree(id)
  else tree.value = []
})

async function loadTree(id: string) {
  loading.value = true
  try {
    const result = await window.nexasql.schema.getTree(id) as { success: boolean; tree: SchemaNode[]; error?: string }
    if (result.success) {
      tree.value = result.tree
      result.tree.forEach((n: SchemaNode) => expanded.value.add(n.name))
    }
  } finally {
    loading.value = false
  }
}

function toggleExpand(key: string) {
  if (expanded.value.has(key)) expanded.value.delete(key)
  else expanded.value.add(key)
}

const nodeIcons: Record<string, unknown> = {
  table: Table2,
  view: Eye,
  procedure: Code2,
  function: Code2,
  sequence: ListOrdered,
  schema: Database
}

const nodeColors: Record<string, string> = {
  table: 'text-sky-400',
  view: 'text-purple-400',
  procedure: 'text-amber-400',
  function: 'text-amber-400',
  sequence: 'text-emerald-400',
  schema: 'text-blue-400',
  group: 'text-muted-foreground'
}

function filterNodes(nodes: SchemaNode[], q: string): SchemaNode[] {
  if (!q) return nodes
  return nodes.reduce<SchemaNode[]>((acc, node) => {
    if (node.children) {
      const filteredChildren = filterNodes(node.children, q)
      if (filteredChildren.length) acc.push({ ...node, children: filteredChildren })
    } else if (node.name.toLowerCase().includes(q.toLowerCase())) {
      acc.push(node)
    }
    return acc
  }, [])
}

const filteredTree = computed(() => filterNodes(tree.value, search.value))

function handleNodeDblClick(node: SchemaNode, parentSchema?: string) {
  if (node.type === 'table' && parentSchema && activeConnectionId.value) {
    tabStore.openTableViewer(activeConnectionId.value, parentSchema, node.name)
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center gap-1 px-2 py-1.5 border-b border-border flex-shrink-0">
      <div class="flex-1 relative">
        <Search :size="10" class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          v-model="search"
          placeholder="Filter objects…"
          class="w-full h-6 pl-5 pr-2 text-xs bg-input border border-border rounded placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <button
        class="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
        :class="{ 'animate-spin': loading }"
        @click="activeConnectionId && loadTree(activeConnectionId)"
      >
        <RefreshCw :size="11" />
      </button>
    </div>

    <ScrollArea class="flex-1">
      <div v-if="!activeConnectionId" class="px-4 py-6 text-center text-xs text-muted-foreground/50">
        Connect to a database to browse objects
      </div>

      <div v-else-if="loading" class="px-4 py-4 text-xs text-muted-foreground/60">
        Loading schema…
      </div>

      <div v-else class="py-1 text-xs select-none">
        <template v-for="schema in filteredTree" :key="schema.name">
          <!-- Schema row -->
          <div
            class="tree-item font-medium"
            @click="toggleExpand(schema.name)"
          >
            <component :is="expanded.has(schema.name) ? ChevronDown : ChevronRight" :size="11" class="text-muted-foreground flex-shrink-0" />
            <Database :size="11" :class="nodeColors.schema" class="flex-shrink-0" />
            <span>{{ schema.name }}</span>
          </div>

          <template v-if="expanded.has(schema.name)">
            <template v-for="group in schema.children" :key="`${schema.name}/${group.name}`">
              <!-- Group row -->
              <div
                class="tree-item pl-5"
                @click="toggleExpand(`${schema.name}/${group.name}`)"
              >
                <component :is="expanded.has(`${schema.name}/${group.name}`) ? ChevronDown : ChevronRight" :size="10" class="text-muted-foreground flex-shrink-0" />
                <span class="text-muted-foreground">{{ group.name }}</span>
                <span class="ml-auto text-[10px] text-muted-foreground/40">{{ group.children?.length ?? 0 }}</span>
              </div>

              <template v-if="expanded.has(`${schema.name}/${group.name}`)">
                <div
                  v-for="node in group.children"
                  :key="`${schema.name}/${group.name}/${node.name}`"
                  class="tree-item pl-10"
                  @dblclick="handleNodeDblClick(node, schema.name)"
                >
                  <component
                    :is="nodeIcons[node.type] ?? Table2"
                    :size="10"
                    :class="nodeColors[node.type]"
                    class="flex-shrink-0"
                  />
                  <span class="truncate">{{ node.name }}</span>
                </div>
              </template>
            </template>
          </template>
        </template>
      </div>
    </ScrollArea>
  </div>
</template>
