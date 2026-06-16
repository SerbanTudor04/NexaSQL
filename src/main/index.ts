import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { registerConnectionHandlers } from './ipc/connection'
import { registerQueryHandlers } from './ipc/query'
import { registerSchemaHandlers } from './ipc/schema'
import { registerOracleSetupHandlers } from './ipc/oracle-setup'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0f1117',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerConnectionHandlers(ipcMain)
  registerQueryHandlers(ipcMain)
  registerSchemaHandlers(ipcMain)
  registerOracleSetupHandlers(ipcMain)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
