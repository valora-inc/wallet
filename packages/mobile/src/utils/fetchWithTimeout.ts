import { FETCH_TIMEOUT_DURATION } from 'src/config'

export const fetchWithTimeout = async (
  url: string,
  body: any | null = null,
  duration: number = FETCH_TIMEOUT_DURATION
): Promise<Response> => {
  try {
    const timeout = new Promise<undefined>((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id)
        reject(Error(`Request timed out after ${duration}ms`))
      }, duration)
    })

    const response = await Promise.race([body ? fetch(url, body) : fetch(url), timeout])
    // Response should always be defined because `reject` throws an error
    // but just satifying the linter with this check
    if (!response) {
      throw Error(`Request timed out after ${duration}ms`)
    }
    return response
  } catch (error) {
    throw error
  }
}
