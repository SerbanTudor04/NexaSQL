<script setup lang="ts">
import { ref, watch, computed, toRaw } from 'vue'
import { useConnectionStore } from '@/stores/connections'
import type { ConnectionConfig } from '@/types'
import { generateId } from '@/lib/utils'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import Select from '@/components/ui/select/Select.vue'

const props = defineProps<{
  open: boolean
  connection: ConnectionConfig | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [config: ConnectionConfig]
}>()

const connectionStore = useConnectionStore()

const defaultForm = (): ConnectionConfig => ({
  id: generateId(),
  name: '',
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: '',
  username: '',
  password: '',
  ssl: false,
  savePassword: true,
  oracle: { mode: 'basic', serviceName: '', privilege: 'default' }
})

const form = ref<ConnectionConfig>(defaultForm())
const testResult = ref<{ success: boolean; message: string } | null>(null)
const testing = ref(false)
const activeTab = ref<'basic' | 'advanced' | 'ssh'>('basic')

watch(() => props.open, (open) => {
  if (open) {
    form.value = props.connection ? { ...props.connection } : defaultForm()
    testResult.value = null
    activeTab.value = 'basic'
  }
})

watch(() => form.value.type, (type) => {
  form.value.port = type === 'oracle' ? 1521 : 5432
})

const dbTypeOptions = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'oracle', label: 'Oracle' }
]

const oracleModeOptions = [
  { value: 'basic', label: 'Basic (Host/Port/Service)' },
  { value: 'tns', label: 'TNS Alias' },
  { value: 'wallet', label: 'OCI Wallet' }
]

const oraclePrivilegeOptions = [
  { value: 'default', label: 'Default' },
  { value: 'sysdba', label: 'SYSDBA' },
  { value: 'sysoper', label: 'SYSOPER' }
]

const isValid = computed(() =>
  form.value.name && form.value.host && form.value.username &&
  (form.value.type === 'oracle' ? !!form.value.oracle?.serviceName || !!form.value.oracle?.tnsAlias : !!form.value.database)
)

async function handleTest() {
  testing.value = true
  testResult.value = null
  try {
    const config = JSON.parse(JSON.stringify({ ...toRaw(form.value), port: Number(form.value.port) }))
    testResult.value = await connectionStore.testConnection(config)
  } catch (err) {
    testResult.value = { success: false, message: String(err) }
  } finally {
    testing.value = false
  }
}

function handleSave() {
  emit('save', JSON.parse(JSON.stringify(toRaw(form.value))))
}
</script>

<template>
  <Dialog
    :open="open"
    :title="connection ? 'Edit Connection' : 'New Connection'"
    description="Configure your database connection settings."
    @update:open="$emit('update:open', $event)"
  >
    <!-- Type selector -->
    <div class="grid grid-cols-2 gap-2 mb-4">
      <div>
        <label class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Database Type</label>
        <Select v-model="form.type" :options="dbTypeOptions" />
      </div>
      <div>
        <label class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Display Name</label>
        <Input v-model="form.name" placeholder="My Database" />
      </div>
    </div>

    <!-- Tab nav -->
    <div class="flex border-b border-border mb-4 gap-4">
      <button
        v-for="tab in ['basic', 'advanced', 'ssh']"
        :key="tab"
        class="pb-1.5 text-xs capitalize border-b-2 transition-colors"
        :class="activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeTab = tab as 'basic' | 'advanced' | 'ssh'"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Basic tab -->
    <div v-if="activeTab === 'basic'" class="space-y-3">
      <!-- Oracle TNS mode -->
      <div v-if="form.type === 'oracle'">
        <label class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Connection Mode</label>
        <Select v-model="form.oracle!.mode" :options="oracleModeOptions" />
      </div>

      <template v-if="form.type !== 'oracle' || form.oracle?.mode === 'basic'">
        <div class="grid grid-cols-3 gap-2">
          <div class="col-span-2">
            <label class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Host</label>
            <Input v-model="form.host" placeholder="localhost" />
          </div>
          <div>
            <label class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Port</label>
            <Input v-model.number="form.port" type="number" />
          </div>
        </div>

        <div>
          <label class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">
            {{ form.type === 'oracle' ? 'Service Name' : 'Database' }}
          </label>
          <Input
            v-if="form.type === 'oracle'"
            v-model="form.oracle!.serviceName"
            placeholder="ORCL"
          />
          <Input v-else v-model="form.database" placeholder="postgres" />
        </div>
      </template>

      <template v-if="form.type === 'oracle' && form.oracle?.mode === 'tns'">
        <div>
          <label class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">TNS Alias</label>
          <Input v-model="form.oracle!.tnsAlias" placeholder="MYDB" />
        </div>
      </template>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Username</label>
          <Input v-model="form.username" placeholder="postgres" autocomplete="off" />
        </div>
        <div>
          <label class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Password</label>
          <Input v-model="form.password" type="password" placeholder="••••••" autocomplete="off" />
        </div>
      </div>

      <div v-if="form.type === 'oracle'">
        <label class="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Privilege</label>
        <Select v-model="form.oracle!.privilege" :options="oraclePrivilegeOptions" />
      </div>

      <label class="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" v-model="form.savePassword" class="rounded" />
        <span class="text-xs text-muted-foreground">Save password (AES-256 encrypted)</span>
      </label>
    </div>

    <!-- Advanced tab -->
    <div v-if="activeTab === 'advanced'" class="space-y-3">
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" v-model="form.ssl" class="rounded" />
        <span class="text-xs text-muted-foreground">Use SSL/TLS</span>
      </label>
    </div>

    <!-- SSH tab -->
    <div v-if="activeTab === 'ssh'" class="space-y-3 text-xs text-muted-foreground">
      <p>SSH tunneling configuration (coming soon)</p>
    </div>

    <!-- Test result -->
    <div v-if="testResult" class="mt-3 p-2 rounded border text-xs" :class="testResult.success ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'">
      {{ testResult.message }}
    </div>

    <!-- Footer -->
    <div class="flex justify-between mt-5 pt-4 border-t border-border">
      <Button variant="outline" :disabled="testing" @click="handleTest">
        {{ testing ? 'Testing…' : 'Test Connection' }}
      </Button>
      <div class="flex gap-2">
        <Button variant="ghost" @click="$emit('update:open', false)">Cancel</Button>
        <Button :disabled="!isValid" @click="handleSave">Save</Button>
      </div>
    </div>
  </Dialog>
</template>
