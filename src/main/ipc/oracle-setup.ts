import { IpcMain } from 'electron'
import { execFile } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import Store from 'electron-store'

const execFileAsync = promisify(execFile)

interface SetupStore {
  oracleSetupDone: boolean
  oracleClientPath: string | null
  oracleMode: 'thin' | 'thick'
}

const setupStore = new Store<SetupStore>({ name: 'nexasql-setup' })

let thickModeInitialized = false
let thickModeClientPath: string | null = null

function getClientLib(): string {
  if (process.platform === 'darwin') return 'libclntsh.dylib'
  if (process.platform === 'win32') return 'oci.dll'
  return 'libclntsh.so'
}

function getCandidatePaths(): string[] {
  const home = os.homedir()
  if (process.platform === 'darwin') {
    return [
      '/opt/homebrew/lib',
      '/usr/local/lib',
      '/opt/oracle/instantclient',
      path.join(home, 'lib'),
    ]
  }
  if (process.platform === 'linux') {
    return [
      '/usr/lib/oracle/21/client64/lib',
      '/usr/lib/oracle/19.8/client64/lib',
      '/opt/oracle/instantclient',
      '/usr/local/lib',
    ]
  }
  if (process.platform === 'win32') {
    return [
      'C:\\oracle\\instantclient',
      path.join(home, 'oracle', 'instantclient'),
    ]
  }
  return []
}

async function findOracleClient(): Promise<string | null> {
  const lib = getClientLib()

  for (const dir of getCandidatePaths()) {
    try {
      await fs.promises.access(path.join(dir, lib))
      return dir
    } catch { /* continue */ }
  }

  // Also glob instantclient_* directories in /opt/oracle and ~/lib
  const bases = ['/opt/oracle', path.join(os.homedir(), 'lib'), '/usr/local/lib']
  for (const base of bases) {
    try {
      const entries = await fs.promises.readdir(base)
      for (const entry of entries.filter(e => e.startsWith('instantclient'))) {
        try {
          await fs.promises.access(path.join(base, entry, lib))
          return path.join(base, entry)
        } catch { /* continue */ }
      }
    } catch { /* dir doesn't exist */ }
  }

  return null
}

export async function tryInitThickMode(libDir?: string): Promise<{ success: boolean; path?: string; error?: string }> {
  if (thickModeInitialized) return { success: true, path: thickModeClientPath ?? undefined }
  try {
    const { default: oracledb } = await import('oracledb')
    if (libDir) {
      oracledb.initOracleClient({ libDir })
    } else {
      oracledb.initOracleClient()
    }
    thickModeInitialized = true
    thickModeClientPath = libDir ?? null
    return { success: true, path: libDir }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function isThickMode(): boolean {
  return thickModeInitialized
}

export function registerOracleSetupHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('oracle:getSetupState', () => ({
    done: setupStore.get('oracleSetupDone', false) as boolean,
    clientPath: setupStore.get('oracleClientPath', null) as string | null,
    mode: setupStore.get('oracleMode', 'thin') as 'thin' | 'thick',
    thickActive: thickModeInitialized,
  }))

  ipcMain.handle('oracle:findClient', async () => {
    const found = await findOracleClient()
    return { path: found }
  })

  ipcMain.handle('oracle:initThick', async (_event, libDir?: string) => {
    const result = await tryInitThickMode(libDir || undefined)
    if (result.success) {
      setupStore.set('oracleClientPath', result.path ?? null)
      setupStore.set('oracleMode', 'thick')
    }
    return result
  })

  ipcMain.handle('oracle:installClient', async () => {
    if (process.platform !== 'darwin') {
      return { success: false, error: 'Auto-install via Homebrew only supported on macOS.' }
    }
    try {
      await execFileAsync('brew', ['--version'])
    } catch {
      return { success: false, error: 'Homebrew not found. Install from https://brew.sh then retry.' }
    }
    try {
      await execFileAsync('brew', ['tap', 'oracle/homebrew-instantclient'])
      await execFileAsync('brew', ['install', 'instantclient-basic'], { timeout: 180000 })
      const found = await findOracleClient()
      return { success: true, path: found }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('oracle:setSetupDone', (_event, mode: 'thin' | 'thick') => {
    setupStore.set('oracleSetupDone', true)
    setupStore.set('oracleMode', mode)
    return { success: true }
  })

  ipcMain.handle('oracle:resetSetup', () => {
    setupStore.clear()
    thickModeInitialized = false
    thickModeClientPath = null
    return { success: true }
  })
}
