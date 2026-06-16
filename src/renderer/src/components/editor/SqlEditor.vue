<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue'
import { useTabStore } from '@/stores/tabs'
import { useTabEditorState } from '@/composables/useTabEditorState'
import EditorToolbar from './EditorToolbar.vue'
import ResultGrid from '@/components/grid/ResultGrid.vue'
import ExecutionPlanVisualizer from '@/components/explain/ExecutionPlanVisualizer.vue'
import type { QueryResult, ExplainNode } from '@/types'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  tabId: string
  connectionId: string
}>()

const tabStore = useTabStore()
const { sql, setSql } = useTabEditorState(props.tabId)

const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const running = ref(false)
const result = ref<QueryResult | null>(null)
const activeResultTab = ref<'grid' | 'plan' | 'messages'>('grid')
const resultPanelHeight = ref(280)
const isResizing = ref(false)

const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  theme: 'nexasql-dark',
  language: 'sql',
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  fontLigatures: true,
  lineHeight: 20,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'line',
  wordWrap: 'on',
  automaticLayout: true,
  suggestOnTriggerCharacters: true,
  quickSuggestions: { other: true, comments: false, strings: false },
  tabSize: 2,
  insertSpaces: true,
  padding: { top: 8, bottom: 8 },
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true },
  overviewRulerLanes: 0,
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }
}

function defineTheme() {
  monaco.editor.defineTheme('nexasql-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'comment', foreground: '608b4e', fontStyle: 'italic' },
      { token: 'number', foreground: 'b5cea8' },
      { token: 'operator', foreground: 'd4d4d4' }
    ],
    colors: {
      'editor.background': '#0f1117',
      'editor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#1e2130',
      'editorLineNumber.foreground': '#3c3c3c',
      'editorLineNumber.activeForeground': '#858585',
      'editor.selectionBackground': '#264f78',
      'editorCursor.foreground': '#aeafad',
      'editor.inactiveSelectionBackground': '#3a3d41'
    }
  })
}

function onEditorMount(editor: monaco.editor.IStandaloneCodeEditor) {
  editorRef.value = editor
  defineTheme()
  monaco.editor.setTheme('nexasql-dark')

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => executeQuery())
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => explainQuery())
}

function getQueryToRun(): string {
  const editor = editorRef.value
  if (!editor) return sql.value

  const selection = editor.getSelection()
  if (selection && !selection.isEmpty()) {
    return editor.getModel()?.getValueInRange(selection) ?? sql.value
  }
  return sql.value
}

async function executeQuery() {
  if (running.value || !props.connectionId) return
  running.value = true
  result.value = null
  activeResultTab.value = 'grid'

  try {
    const queryResult = await window.nexasql.query.execute({
      connectionId: props.connectionId,
      sql: getQueryToRun()
    }) as QueryResult
    result.value = queryResult
    if (!queryResult.success) activeResultTab.value = 'messages'
  } finally {
    running.value = false
  }
}

async function explainQuery() {
  if (running.value || !props.connectionId) return
  running.value = true
  result.value = null

  try {
    const explainResult = await window.nexasql.query.explain({
      connectionId: props.connectionId,
      sql: getQueryToRun()
    }) as QueryResult
    result.value = explainResult
    if (explainResult.success) activeResultTab.value = 'plan'
  } finally {
    running.value = false
  }
}

function formatSql() {
  // Basic keyword uppercasing
  const formatted = sql.value
    .replace(/\b(select|from|where|join|left|right|inner|outer|on|and|or|order by|group by|having|insert|into|values|update|set|delete|create|alter|drop|table|index|view|as|not|null|is|in|like|between|exists|union|all|distinct|limit|offset|with|case|when|then|else|end)\b/gi,
      (m) => m.toUpperCase())
  setSql(formatted)
}

function startResizePanel(e: MouseEvent) {
  isResizing.value = true
  const startY = e.clientY
  const startH = resultPanelHeight.value
  const onMove = (e: MouseEvent) => {
    resultPanelHeight.value = Math.max(100, Math.min(600, startH - (e.clientY - startY)))
  }
  const onUp = () => {
    isResizing.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <EditorToolbar
      :running="running"
      :connection-id="connectionId"
      :result="result"
      @run="executeQuery"
      @explain="explainQuery"
      @format="formatSql"
      @cancel="() => window.nexasql.query.cancel(connectionId)"
    />

    <div class="flex-1 overflow-hidden" :style="`height: calc(100% - ${result ? resultPanelHeight + 32 : 0}px - 32px)`">
      <VueMonacoEditor
        v-model:value="sql"
        :options="editorOptions"
        language="sql"
        class="h-full"
        @mount="onEditorMount"
      />
    </div>

    <!-- Result panel -->
    <template v-if="result">
      <div
        class="h-1 cursor-row-resize hover:bg-primary/40 transition-colors flex-shrink-0"
        :class="{ 'bg-primary/60': isResizing }"
        @mousedown="startResizePanel"
      />

      <div :style="`height: ${resultPanelHeight}px`" class="flex flex-col border-t border-border flex-shrink-0 overflow-hidden">
        <!-- Result tabs bar -->
        <div class="flex items-center border-b border-border px-2 gap-3 flex-shrink-0 h-8">
          <button
            v-for="tab in [
              { id: 'grid', label: `Results${result.rowCount != null ? ` (${result.rowCount})` : ''}` },
              ...(result.plan ? [{ id: 'plan', label: 'Execution Plan' }] : []),
              { id: 'messages', label: `Messages${result.error ? ' ⚠' : ''}` }
            ]"
            :key="tab.id"
            class="text-xs py-1 border-b-2 transition-colors"
            :class="activeResultTab === tab.id
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'"
            @click="activeResultTab = tab.id as 'grid' | 'plan' | 'messages'"
          >
            {{ tab.label }}
          </button>

          <div class="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground/60">
            <span v-if="result.executionTime != null">{{ result.executionTime }}ms</span>
          </div>
        </div>

        <!-- Grid -->
        <div v-if="activeResultTab === 'grid'" class="flex-1 overflow-hidden">
          <ResultGrid
            v-if="result.columns && result.rows"
            :columns="result.columns"
            :rows="result.rows"
          />
          <div v-else-if="!result.success" class="p-3 text-xs text-red-400">{{ result.error }}</div>
          <div v-else class="p-3 text-xs text-muted-foreground">Query executed successfully. {{ result.rowCount }} rows affected.</div>
        </div>

        <!-- Execution plan -->
        <div v-if="activeResultTab === 'plan'" class="flex-1 overflow-hidden">
          <ExecutionPlanVisualizer v-if="result.plan" :plan="result.plan as ExplainNode[]" />
        </div>

        <!-- Messages -->
        <div v-if="activeResultTab === 'messages'" class="flex-1 overflow-auto p-3 font-mono text-xs">
          <div v-if="result.error" class="text-red-400">{{ result.error }}</div>
          <div v-if="result.notices?.length" class="space-y-1 text-amber-400">
            <div v-for="(n, i) in result.notices" :key="i">{{ n }}</div>
          </div>
          <div v-if="!result.error && !result.notices?.length" class="text-emerald-400">
            Query OK — {{ result.rowCount ?? 0 }} rows, {{ result.executionTime }}ms
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
