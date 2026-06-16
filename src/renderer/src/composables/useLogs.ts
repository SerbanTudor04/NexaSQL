import { ref } from 'vue'

export type LogLevel = 'info' | 'success' | 'error' | 'warning'

export interface LogEntry {
  id: number
  time: string
  level: LogLevel
  message: string
}

const logs = ref<LogEntry[]>([
  { id: 1, time: new Date().toLocaleTimeString(), level: 'info', message: 'NexaSQL initialized.' }
])

let logId = 2

export function useLogs() {
  function addLog(level: LogLevel, message: string) {
    logs.value.push({
      id: logId++,
      time: new Date().toLocaleTimeString(),
      level,
      message
    })
  }

  function clearLogs() {
    logs.value = []
  }

  return { logs, addLog, clearLogs }
}
