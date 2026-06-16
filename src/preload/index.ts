import { contextBridge, ipcRenderer } from 'electron'

const api = {
  connection: {
    list: () => ipcRenderer.invoke('connection:list'),
    save: (config: unknown) => ipcRenderer.invoke('connection:save', config),
    delete: (id: string) => ipcRenderer.invoke('connection:delete', id),
    test: (config: unknown) => ipcRenderer.invoke('connection:test', config),
    connect: (config: unknown) => ipcRenderer.invoke('connection:connect', config),
    disconnect: (id: string) => ipcRenderer.invoke('connection:disconnect', id)
  },
  query: {
    execute: (req: unknown) => ipcRenderer.invoke('query:execute', req),
    explain: (req: unknown) => ipcRenderer.invoke('query:explain', req),
    cancel: (connectionId: string) => ipcRenderer.invoke('query:cancel', connectionId)
  },
  schema: {
    getTree: (connectionId: string) => ipcRenderer.invoke('schema:getTree', connectionId),
    getTableDetails: (connectionId: string, schema: string, table: string) =>
      ipcRenderer.invoke('schema:getTableDetails', connectionId, schema, table),
    getSessions: (connectionId: string) => ipcRenderer.invoke('schema:getSessions', connectionId),
    killSession: (connectionId: string, pid: number) =>
      ipcRenderer.invoke('schema:killSession', connectionId, pid),
    getTablespaces: (connectionId: string) => ipcRenderer.invoke('schema:getTablespaces', connectionId),
    getStorageStats: (connectionId: string) => ipcRenderer.invoke('schema:getStorageStats', connectionId),
    autocomplete: (connectionId: string, prefix: string) =>
      ipcRenderer.invoke('schema:autocomplete', connectionId, prefix)
  }
}

contextBridge.exposeInMainWorld('nexasql', api)

export type NexaSQLAPI = typeof api
