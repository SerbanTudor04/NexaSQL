<script setup lang="ts">
import { computed, ref } from 'vue'
import { VueFlow, useVueFlow, type Node, type Edge } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { ExplainNode } from '@/types'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

const props = defineProps<{ plan: ExplainNode[] | unknown }>()

const selectedNode = ref<ExplainNode | null>(null)

function getCostColor(totalCost: number, maxCost: number): string {
  const ratio = maxCost > 0 ? totalCost / maxCost : 0
  if (ratio > 0.75) return '#ef4444'
  if (ratio > 0.4) return '#f59e0b'
  return '#10b981'
}

function getMaxCost(node: ExplainNode): number {
  let max = node['Total Cost'] ?? 0
  if (node.Plans) {
    for (const child of node.Plans) {
      max = Math.max(max, getMaxCost(child))
    }
  }
  return max
}

interface FlowGraph {
  nodes: Node[]
  edges: Edge[]
}

function buildGraph(planNode: ExplainNode, parentId: string | null, x: number, y: number, maxCost: number, acc: FlowGraph): void {
  const id = `node-${acc.nodes.length}`
  const label = [
    planNode['Node Type'],
    planNode['Relation Name'] ? `→ ${planNode['Relation Name']}` : '',
    planNode['Index Name'] ? `idx: ${planNode['Index Name']}` : ''
  ].filter(Boolean).join(' ')

  acc.nodes.push({
    id,
    type: 'default',
    position: { x, y },
    data: {
      label,
      planNode,
      costColor: getCostColor(planNode['Total Cost'] ?? 0, maxCost)
    },
    style: {
      background: '#1e2130',
      border: `1px solid ${getCostColor(planNode['Total Cost'] ?? 0, maxCost)}`,
      borderRadius: '6px',
      padding: '8px 12px',
      fontSize: '11px',
      color: '#d4d4d4',
      minWidth: '160px',
      cursor: 'pointer'
    }
  })

  if (parentId) {
    acc.edges.push({
      id: `e-${parentId}-${id}`,
      source: parentId,
      target: id,
      style: { stroke: '#374151', strokeWidth: 1 },
      animated: false
    })
  }

  if (planNode.Plans) {
    const childCount = planNode.Plans.length
    const spacing = 220
    const startX = x - ((childCount - 1) * spacing) / 2

    planNode.Plans.forEach((child, i) => {
      buildGraph(child, id, startX + i * spacing, y + 120, maxCost, acc)
    })
  }
}

const { nodes, edges } = computed(() => {
  const plan = Array.isArray(props.plan) ? props.plan[0]?.Plan : null
  if (!plan) return { nodes: [], edges: [] }

  const maxCost = getMaxCost(plan as ExplainNode)
  const acc: FlowGraph = { nodes: [], edges: [] }
  buildGraph(plan as ExplainNode, null, 0, 0, maxCost, acc)
  return acc
}).value

const flowNodes = computed(() => {
  const plan = Array.isArray(props.plan) ? props.plan[0]?.Plan : null
  if (!plan) return []
  const maxCost = getMaxCost(plan as ExplainNode)
  const acc: FlowGraph = { nodes: [], edges: [] }
  buildGraph(plan as ExplainNode, null, 0, 0, maxCost, acc)
  return acc.nodes
})

const flowEdges = computed(() => {
  const plan = Array.isArray(props.plan) ? props.plan[0]?.Plan : null
  if (!plan) return []
  const maxCost = getMaxCost(plan as ExplainNode)
  const acc: FlowGraph = { nodes: [], edges: [] }
  buildGraph(plan as ExplainNode, null, 0, 0, maxCost, acc)
  return acc.edges
})

function onNodeClick(_: unknown, node: Node) {
  selectedNode.value = node.data?.planNode ?? null
}
</script>

<template>
  <div class="h-full flex overflow-hidden">
    <div class="flex-1 relative">
      <VueFlow
        :nodes="flowNodes"
        :edges="flowEdges"
        fit-view-on-init
        class="h-full"
        @node-click="onNodeClick"
      >
        <Background pattern-color="#1e2130" gap="20" />
        <Controls />
      </VueFlow>

      <div v-if="!flowNodes.length" class="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
        No execution plan data
      </div>
    </div>

    <!-- Detail panel -->
    <div v-if="selectedNode" class="w-64 border-l border-border bg-card overflow-auto p-3 text-xs flex-shrink-0">
      <p class="font-semibold text-foreground mb-3">{{ selectedNode['Node Type'] }}</p>
      <div class="space-y-1.5">
        <template v-for="(val, key) in selectedNode" :key="key">
          <div v-if="key !== 'Plans' && val !== undefined && val !== null" class="flex gap-2">
            <span class="text-muted-foreground/70 flex-shrink-0 w-28 truncate">{{ key }}</span>
            <span class="text-foreground truncate">{{ typeof val === 'object' ? JSON.stringify(val) : String(val) }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
