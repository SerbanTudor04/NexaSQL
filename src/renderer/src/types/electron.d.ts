import type { NexaSQLAPI } from '../../../preload'

declare global {
  interface Window {
    nexasql: NexaSQLAPI
  }
}

export {}
