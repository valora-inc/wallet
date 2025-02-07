import { AsyncStateStatus } from 'react-async-hook'

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export function toAsyncStatus(status: AsyncStateStatus): AsyncStatus {
  switch (status) {
    case 'not-requested':
      return 'idle'
    case 'loading':
      return 'loading'
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    default:
      const exhaustiveCheck: never = status
      return exhaustiveCheck
  }
}
