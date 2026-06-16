<script setup lang="ts">
import { ref } from 'vue'
import { useConnectionStore } from '@/stores/connections'
import { useTabStore } from '@/stores/tabs'
import { Plus, Database, Plug, PlugZap, Trash2, Settings } from '@lucide/vue'
import Button from '@/components/ui/button/Button.vue'
import Badge from '@/components/ui/badge/Badge.vue'
import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue'
import ConnectionDialog from './ConnectionDialog.vue'
import type { ConnectionConfig } from '@/types'
import { generateId } from '@/lib/utils'

const connectionStore = useConnectionStore()
const tabStore = useTabStore()

const dialogOpen = ref(false)
const editingConnection = ref<ConnectionConfig | null>(null)
const connectingId = ref<string | null>(null)

function openNew() {
  editingConnection.value = null
  dialogOpen.value = true
}

function openEdit(conn: ConnectionConfig) {
  editingConnection.value = conn
  dialogOpen.value = true
}

async function handleConnect(conn: ConnectionConfig) {
  connectingId.value = conn.id
  const result = await connectionStore.connectTo(conn)
  connectingId.value = null

  if (result.success) {
    tabStore.openSqlEditor(conn.id)
  }
}

async function handleDisconnect(conn: ConnectionConfig) {
  await connectionStore.disconnect(conn.id)
}

function openSqlSheet(conn: ConnectionConfig) {
  tabStore.openSqlEditor(conn.id)
}

async function handleDelete(id: string) {
  await connectionStore.deleteConnection(id)
}

async function handleSave(config: ConnectionConfig) {
  if (!config.id) config.id = generateId()
  await connectionStore.saveConnection(config)
  dialogOpen.value = false
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-2 py-1.5 border-b border-border flex-shrink-0">
      <span class="text-xs font-medium text-muted-foreground">Connections</span>
      <Button variant="ghost" size="icon" @click="openNew">
        <Plus :size="13" />
      </Button>
    </div>

    <ScrollArea class="flex-1">
      <div class="p-1">
        <div v-if="connectionStore.connections.length === 0" class="px-3 py-6 text-center text-xs text-muted-foreground/50">
          No connections yet.<br/>Click + to add one.
        </div>

        <div
          v-for="conn in connectionStore.connections"
          :key="conn.id"
          class="group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent transition-colors"
          :class="{ 'bg-primary/10': conn.id === connectionStore.activeConnectionId }"
          @dblclick="openSqlSheet(conn)"
        >
          <span
            class="h-1.5 w-1.5 rounded-full flex-shrink-0 transition-colors"
            :class="connectionStore.isConnected(conn.id) ? 'bg-emerald-400' : 'bg-muted-foreground/30'"
          />
          <Database :size="12" class="flex-shrink-0 text-muted-foreground" />
          <div class="flex-1 min-w-0">
            <p class="text-xs truncate">{{ conn.name }}</p>
            <p class="text-[10px] text-muted-foreground/60 truncate">{{ conn.type }} · {{ conn.host }}</p>
          </div>
          <Badge :variant="conn.type === 'oracle' ? 'warning' : 'secondary'" class="text-[9px] hidden group-hover:inline-flex">
            {{ conn.type === 'oracle' ? 'ORA' : 'PG' }}
          </Badge>

          <div class="hidden group-hover:flex items-center gap-0.5">
            <button
              class="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              :title="connectionStore.isConnected(conn.id) ? 'Disconnect' : 'Connect'"
              @click.stop="connectionStore.isConnected(conn.id) ? handleDisconnect(conn) : handleConnect(conn)"
            >
              <component :is="connectionStore.isConnected(conn.id) ? PlugZap : Plug" :size="11" />
            </button>
            <button class="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground" @click.stop="openEdit(conn)">
              <Settings :size="11" />
            </button>
            <button class="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive" @click.stop="handleDelete(conn.id)">
              <Trash2 :size="11" />
            </button>
          </div>
        </div>
      </div>
    </ScrollArea>

    <ConnectionDialog
      :open="dialogOpen"
      :connection="editingConnection"
      @update:open="dialogOpen = $event"
      @save="handleSave"
    />
  </div>
</template>
