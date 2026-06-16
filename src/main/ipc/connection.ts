import { IpcMain } from 'electron'
import { Client as PgClient, Pool as PgPool } from 'pg'
import Store from 'electron-store'
import * as crypto from 'crypto'
import { tryInitThickMode } from './oracle-setup'

interface ConnectionConfig {
  id: string
  name: string
  type: 'postgresql' | 'oracle'
  host: string
  port: number
  database: string
  username: string
  password?: string
  ssl?: boolean
  sshTunnel?: {
    host: string
    port: number
    username: string
    privateKey?: string
  }
  oracle?: {
    mode: 'basic' | 'tns' | 'ldaps' | 'wallet'
    serviceName?: string
    sid?: string
    tnsAlias?: string
    walletPath?: string
  }
  savePassword: boolean
}

interface StoreSchema {
  connections: ConnectionConfig[]
}

const store = new Store<StoreSchema>({ name: 'nexasql-connections' })
const pools = new Map<string, PgPool>()

const ENCRYPTION_KEY = crypto.scryptSync('nexasql-key-v1', 'salt', 32)

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt(data: string): string {
  const [ivHex, encryptedHex] = data.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

export function registerConnectionHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('connection:list', () => {
    const connections = (store.get('connections') as ConnectionConfig[]) || []
    return connections.map((c) => ({ ...c, password: c.password ? '••••••••' : undefined }))
  })

  ipcMain.handle('connection:save', async (_event, config: ConnectionConfig) => {
    const connections = (store.get('connections') as ConnectionConfig[]) || []
    const saved = { ...config }

    if (config.password && config.savePassword) {
      saved.password = encrypt(config.password)
    } else if (!config.savePassword) {
      delete saved.password
    }

    const idx = connections.findIndex((c) => c.id === config.id)
    if (idx >= 0) {
      connections[idx] = saved
    } else {
      connections.push(saved)
    }

    store.set('connections', connections)
    return { success: true, id: saved.id }
  })

  ipcMain.handle('connection:delete', (_event, id: string) => {
    const connections = (store.get('connections') as ConnectionConfig[]) || []
    const filtered = connections.filter((c) => c.id !== id)
    store.set('connections', filtered)

    const pool = pools.get(id)
    if (pool) {
      pool.end()
      pools.delete(id)
    }

    return { success: true }
  })

  ipcMain.handle('connection:test', async (_event, config: ConnectionConfig) => {
    try {
      if (config.type === 'postgresql') {
        const client = new PgClient({
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.username,
          password: config.password,
          ssl: config.ssl ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 5000
        })
        await client.connect()
        await client.query('SELECT 1')
        await client.end()
        return { success: true, message: 'Connection successful' }
      }

      if (config.type === 'oracle') {
        try {
          await tryInitThickMode()
          const { default: oracledb } = await import('oracledb')
          let connectString = config.host + ':' + config.port + '/' + config.oracle?.serviceName
          if (config.oracle?.mode === 'tns' && config.oracle.tnsAlias) {
            connectString = config.oracle.tnsAlias
          }
          const conn = await oracledb.getConnection({
            user: config.username,
            password: config.password,
            connectString
          })
          await conn.execute('SELECT 1 FROM DUAL')
          await conn.close()
          return { success: true, message: 'Connection successful' }
        } catch (oraErr: unknown) {
          const msg = oraErr instanceof Error ? oraErr.message : String(oraErr)
          return { success: false, message: msg }
        }
      }

      return { success: false, message: 'Unknown database type' }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('connection:connect', async (_event, config: ConnectionConfig) => {
    try {
      if (config.type === 'postgresql') {
        const password = config.password?.includes(':') ? decrypt(config.password) : config.password

        const existing = pools.get(config.id)
        if (existing) {
          await existing.query('SELECT 1')
          return { success: true, connectionId: config.id }
        }

        const pool = new PgPool({
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.username,
          password,
          ssl: config.ssl ? { rejectUnauthorized: false } : false,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000
        })

        await pool.query('SELECT 1')
        pools.set(config.id, pool)
        return { success: true, connectionId: config.id }
      }

      return { success: false, message: 'Oracle connection pooling coming soon' }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('connection:disconnect', async (_event, connectionId: string) => {
    const pool = pools.get(connectionId)
    if (pool) {
      await pool.end()
      pools.delete(connectionId)
    }
    return { success: true }
  })

  ipcMain.handle('connection:getPool', (_event, connectionId: string) => {
    return pools.has(connectionId)
  })
}

export { pools }
