export const fetchWithTimeout = async (
  url: string,
  body: any | null,
  duration: number
): Promise<Response | undefined> => {
  try {
    const timeout = new Promise<undefined>((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id)
        reject(Error(`Request timed out after ${duration}ms`))
      }, duration)
    })

    return Promise.race([body ? fetch(url, body) : fetch(url), timeout])
  } catch (error) {
    throw error
  }
}
