import { ref, watch } from 'vue'
import { useTabStore } from '@/stores/tabs'

const editorStateMap = new Map<string, ReturnType<typeof ref<string>>>()

export function useTabEditorState(tabId: string) {
  if (!editorStateMap.has(tabId)) {
    editorStateMap.set(tabId, ref('-- NexaSQL Worksheet\n-- Press Ctrl+Enter to execute\n\n'))
  }

  const sql = editorStateMap.get(tabId)!
  const tabStore = useTabStore()

  function setSql(value: string) {
    sql.value = value
  }

  watch(sql, () => {
    tabStore.updateTab(tabId, { isDirty: true })
  })

  return { sql, setSql }
}
