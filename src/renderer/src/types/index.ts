export interface ConnectionConfig {
  id: string
  name: string
  type: 'postgresql' | 'oracle'
  host: string
  port: number
  database: string
  username: string
  password?: string
  ssl?: boolean
  savePassword: boolean
  oracle?: {
    mode: 'basic' | 'tns' | 'ldaps' | 'wallet'
    serviceName?: string
    sid?: string
    tnsAlias?: string
    walletPath?: string
    privilege?: 'default' | 'sysdba' | 'sysoper'
  }
  sshTunnel?: {
    host: string
    port: number
    username: string
    privateKey?: string
  }
}

export interface ColumnInfo {
  name: string
  dataType: string
  nullable: boolean
}

export interface QueryResult {
  success: boolean
  columns?: ColumnInfo[]
  rows?: unknown[][]
  rowCount?: number
  executionTime?: number
  error?: string
  notices?: string[]
  plan?: ExplainNode[]
}

export interface ExplainNode {
  'Node Type': string
  'Startup Cost': number
  'Total Cost': number
  'Plan Rows': number
  'Plan Width': number
  'Actual Startup Time'?: number
  'Actual Total Time'?: number
  'Actual Rows'?: number
  'Actual Loops'?: number
  'Relation Name'?: string
  'Alias'?: string
  'Index Name'?: string
  'Index Cond'?: string
  'Filter'?: string
  'Join Type'?: string
  'Hash Cond'?: string
  'Plans'?: ExplainNode[]
  [key: string]: unknown
}

export type TabType = 'sql-editor' | 'table-viewer' | 'execution-plan' | 'session-browser' | 'storage-manager'

export interface Tab {
  id: string
  type: TabType
  title: string
  connectionId?: string
  data?: unknown
  isDirty?: boolean
}

export interface SchemaNode {
  name: string
  type: 'schema' | 'group' | 'table' | 'view' | 'function' | 'procedure' | 'sequence' | 'index' | 'trigger'
  icon?: string
  children?: SchemaNode[]
}

export interface SessionInfo {
  pid: number
  username: string
  application_name: string
  client_addr: string
  state: string
  wait_event_type?: string
  wait_event?: string
  query_start?: string
  query?: string
  backend_start?: string
}

export interface StorageStat {
  schemaname: string
  tablename: string
  total_bytes: number
  table_bytes: number
  index_bytes: number
  total_pretty: string
}
