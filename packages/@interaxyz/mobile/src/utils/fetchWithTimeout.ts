import { FETCH_TIMEOUT_DURATION } from 'src/config'

export const fetchWithTimeout = async (
  url: string,
  options: RequestInit | null = null,
  duration: number = FETCH_TIMEOUT_DURATION
): Promise<Response> => {
  const controller = new AbortController()
  const id = setTimeout(() => {
    controller.abort()
  }, duration)
  const response = await fetch(url, { ...options, signal: controller.signal })
  clearTimeout(id)
  return response
}
