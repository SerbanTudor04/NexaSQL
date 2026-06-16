import { IpcMain } from 'electron'
import { pools } from './connection'

interface QueryRequest {
  connectionId: string
  sql: string
  limit?: number
  offset?: number
}

interface QueryResult {
  success: boolean
  columns?: ColumnInfo[]
  rows?: unknown[][]
  rowCount?: number
  executionTime?: number
  error?: string
  notices?: string[]
  plan?: unknown
}

interface ColumnInfo {
  name: string
  dataType: string
  nullable: boolean
  tableID?: number
  columnID?: number
}

export function registerQueryHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('query:execute', async (_event, req: QueryRequest): Promise<QueryResult> => {
    const pool = pools.get(req.connectionId)
    if (!pool) {
      return { success: false, error: 'Not connected. Please connect first.' }
    }

    const start = Date.now()
    const client = await pool.connect()

    try {
      const notices: string[] = []
      client.on('notice', (msg) => notices.push(msg.message))

      const result = await client.query({
        text: req.sql,
        rowMode: 'array'
      })

      const executionTime = Date.now() - start

      const columns: ColumnInfo[] = (result.fields || []).map((f) => ({
        name: f.name,
        dataType: pgTypeToName(f.dataTypeID),
        nullable: true,
        tableID: f.tableID,
        columnID: f.columnID
      }))

      return {
        success: true,
        columns,
        rows: result.rows as unknown[][],
        rowCount: result.rowCount ?? result.rows.length,
        executionTime,
        notices
      }
    } catch (err: unknown) {
      const error = err as Error & { position?: string; hint?: string }
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - start
      }
    } finally {
      client.release()
    }
  })

  ipcMain.handle('query:explain', async (_event, req: QueryRequest): Promise<QueryResult> => {
    const pool = pools.get(req.connectionId)
    if (!pool) return { success: false, error: 'Not connected.' }

    const start = Date.now()
    const client = await pool.connect()

    try {
      const sql = `EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS, VERBOSE) ${req.sql}`
      const result = await client.query(sql)
      const plan = result.rows[0]['QUERY PLAN']

      return {
        success: true,
        plan,
        executionTime: Date.now() - start
      }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    } finally {
      client.release()
    }
  })

  ipcMain.handle('query:cancel', async (_event, connectionId: string) => {
    const pool = pools.get(connectionId)
    if (!pool) return { success: false }

    try {
      const client = await pool.connect()
      await client.query('SELECT pg_cancel_backend(pg_backend_pid())')
      client.release()
      return { success: true }
    } catch {
      return { success: false }
    }
  })
}

function pgTypeToName(oid: number): string {
  const types: Record<number, string> = {
    16: 'boolean',
    20: 'int8',
    21: 'int2',
    23: 'int4',
    25: 'text',
    700: 'float4',
    701: 'float8',
    1043: 'varchar',
    1082: 'date',
    1114: 'timestamp',
    1184: 'timestamptz',
    1700: 'numeric',
    2950: 'uuid',
    3802: 'jsonb',
    114: 'json'
  }
  return types[oid] || `oid:${oid}`
}
