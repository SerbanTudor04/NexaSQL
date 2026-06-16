<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSetupStore } from '@/stores/setup'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'

const emit = defineEmits<{ done: [] }>()

const setupStore = useSetupStore()

type Step = 'detecting' | 'found' | 'not-found' | 'manual' | 'init-error' | 'complete'

const copied = ref<string | null>(null)
async function copyText(text: string, key: string) {
  await navigator.clipboard.writeText(text)
  copied.value = key
  setTimeout(() => { copied.value = null }, 1500)
}

const step = ref<Step>('detecting')
const foundPath = ref<string | null>(null)
const manualPath = ref('')
const errorMsg = ref('')
const initError = ref('')

onMounted(async () => {
  const result = await window.nexasql.oracle.findClient() as { path: string | null }
  foundPath.value = result.path
  step.value = result.path ? 'found' : 'not-found'
})

async function acceptFound() {
  const res = await window.nexasql.oracle.initThick(foundPath.value ?? undefined) as { success: boolean; error?: string }
  if (res.success) {
    await setupStore.markDone('thick')
    step.value = 'complete'
  } else {
    initError.value = res.error ?? 'Unknown error'
    step.value = 'init-error'
  }
}

async function openDownloadPage() {
  await window.nexasql.oracle.openDownloadPage()
}

async function acceptManual() {
  const res = await window.nexasql.oracle.initThick(manualPath.value) as { success: boolean; error?: string }
  if (res.success) {
    foundPath.value = manualPath.value
    await setupStore.markDone('thick')
    step.value = 'complete'
  } else {
    initError.value = res.error ?? 'Unknown error'
    step.value = 'init-error'
  }
}

async function skipToThin() {
  await setupStore.markDone('thin')
  emit('done')
}

function finish() {
  emit('done')
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-background flex items-center justify-center">
    <div class="w-[520px] rounded-xl border border-border bg-card p-8 shadow-2xl">

      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 text-base font-bold">
            Ox
          </div>
          <h1 class="text-lg font-semibold text-foreground">Oracle Client Setup</h1>
        </div>
        <p class="text-xs text-muted-foreground">
          Oracle thick mode gives full compatibility. Thin mode works for basic connections but lacks some features (NJS-116).
        </p>
      </div>

      <!-- Step: detecting -->
      <div v-if="step === 'detecting'" class="space-y-4">
        <div class="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
          <div class="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <span class="text-sm text-muted-foreground">Scanning for Oracle Instant Client…</span>
        </div>
      </div>

      <!-- Step: found -->
      <div v-else-if="step === 'found'" class="space-y-4">
        <div class="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
          <p class="text-xs font-medium text-emerald-400 mb-1">Client found</p>
          <code class="text-xs text-emerald-300 break-all">{{ foundPath }}</code>
        </div>
        <p class="text-xs text-muted-foreground">Initialize thick mode using this client?</p>
        <div class="flex gap-2 pt-2">
          <Button class="flex-1" @click="acceptFound">Use this client</Button>
          <Button variant="outline" @click="step = 'not-found'">Different path</Button>
        </div>
      </div>

      <!-- Step: not-found -->
      <div v-else-if="step === 'not-found'" class="space-y-4">
        <div class="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
          <p class="text-xs font-medium text-amber-400 mb-1">Oracle Instant Client not found</p>
          <p class="text-xs text-amber-300/80">Thick mode requires Oracle Instant Client installed on this machine.</p>
        </div>

        <div v-if="errorMsg" class="p-3 rounded border border-red-500/30 bg-red-500/10 text-xs text-red-400 flex items-start justify-between gap-2">
          <span class="break-all">{{ errorMsg }}</span>
          <button
            class="shrink-0 text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
            @click="copyText(errorMsg, 'install-err')"
          >{{ copied === 'install-err' ? 'Copied' : 'Copy' }}</button>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-medium text-foreground">Options</p>

          <button
            class="w-full text-left p-3 rounded-lg border border-border hover:border-orange-500/50 hover:bg-orange-500/5 transition-colors"
            @click="openDownloadPage"
          >
            <p class="text-xs font-medium text-foreground">Download Oracle Instant Client</p>
            <p class="text-[11px] text-muted-foreground mt-0.5">
              Opens oracle.com → download Basic package → extract → enter path below
            </p>
          </button>

          <button
            class="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
            @click="step = 'manual'"
          >
            <p class="text-xs font-medium text-foreground">I already have it — enter path</p>
            <p class="text-[11px] text-muted-foreground mt-0.5">Point to an existing instantclient directory</p>
          </button>
        </div>

        <div class="pt-2 border-t border-border">
          <button class="text-xs text-muted-foreground hover:text-foreground transition-colors" @click="skipToThin">
            Skip — use thin mode only (limited Oracle compatibility)
          </button>
        </div>
      </div>

      <!-- Step: manual path -->
      <div v-else-if="step === 'manual'" class="space-y-4">
        <p class="text-xs text-muted-foreground">
          Enter the directory containing <code class="text-foreground">libclntsh.dylib</code> (macOS) or <code class="text-foreground">libclntsh.so</code> (Linux).
        </p>
        <Input
          v-model="manualPath"
          placeholder="/opt/oracle/instantclient_21_3"
          class="font-mono text-xs"
        />
        <div class="flex gap-2">
          <Button class="flex-1" :disabled="!manualPath.trim()" @click="acceptManual">Initialize</Button>
          <Button variant="outline" @click="step = 'not-found'">Back</Button>
        </div>
      </div>

      <!-- Step: init error -->
      <div v-else-if="step === 'init-error'" class="space-y-4">
        <div class="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
          <div class="flex items-center justify-between mb-1">
            <p class="text-xs font-medium text-red-400">Initialization failed</p>
            <button
              class="text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
              @click="copyText(initError, 'init-err')"
            >{{ copied === 'init-err' ? 'Copied' : 'Copy' }}</button>
          </div>
          <code class="text-[11px] text-red-300/80 break-all">{{ initError }}</code>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" class="flex-1" @click="step = 'not-found'">Try again</Button>
          <Button variant="ghost" @click="skipToThin">Skip</Button>
        </div>
      </div>

      <!-- Step: complete -->
      <div v-else-if="step === 'complete'" class="space-y-4">
        <div class="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
          <p class="text-xs font-medium text-emerald-400 mb-1">Thick mode active</p>
          <code class="text-xs text-emerald-300 break-all">{{ foundPath }}</code>
        </div>
        <p class="text-xs text-muted-foreground">Full Oracle compatibility enabled. You can reset this from Settings.</p>
        <Button class="w-full" @click="finish">Continue to app</Button>
      </div>

    </div>
  </div>
</template>
