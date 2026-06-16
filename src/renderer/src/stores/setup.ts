import { defineStore } from 'pinia'
import { ref } from 'vue'

export type OracleMode = 'thin' | 'thick'

export interface SetupState {
  done: boolean
  clientPath: string | null
  mode: OracleMode
  thickActive: boolean
}

export const useSetupStore = defineStore('setup', () => {
  const loaded = ref(false)
  const setupDone = ref(true) // optimistic — avoids flash on non-Oracle users
  const oracleMode = ref<OracleMode>('thin')
  const oracleClientPath = ref<string | null>(null)
  const thickActive = ref(false)

  async function load() {
    if (!window.nexasql?.oracle) {
      setupDone.value = true
      loaded.value = true
      return
    }
    const state = await window.nexasql.oracle.getSetupState() as SetupState
    setupDone.value = state.done
    oracleMode.value = state.mode
    oracleClientPath.value = state.clientPath
    thickActive.value = state.thickActive
    loaded.value = true
  }

  async function markDone(mode: OracleMode) {
    await window.nexasql.oracle.setSetupDone(mode)
    setupDone.value = true
    oracleMode.value = mode
  }

  return { loaded, setupDone, oracleMode, oracleClientPath, thickActive, load, markDone }
})
