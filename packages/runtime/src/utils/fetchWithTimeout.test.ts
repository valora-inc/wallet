import { FetchMock } from 'jest-fetch-mock'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'

const mockFetch = fetch as FetchMock

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it('returns response if request completes within timeout', async () => {
    mockFetch.mockResponseOnce('success')

    const response = await fetchWithTimeout('https://does-not-matter')

    expect(response.ok).toEqual(true)
    expect(await response.text()).toEqual('success')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith('https://does-not-matter', {
      signal: expect.any(AbortSignal),
    })
  })

  it('returns response for request with options if it completes within timeout', async () => {
    mockFetch.mockResponseOnce('success')

    const response = await fetchWithTimeout('https://does-not-matter', {
      method: 'POST',
      body: JSON.stringify({ some: 'body' }),
    })

    expect(response.ok).toEqual(true)
    expect(await response.text()).toEqual('success')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith('https://does-not-matter', {
      method: 'POST',
      body: JSON.stringify({ some: 'body' }),
      signal: expect.any(AbortSignal),
    })
  })

  it('throws if request does not complete within timeout', async () => {
    mockFetch.mockResponseOnce(async () => {
      jest.advanceTimersByTime(2000) // timeout is 1000
      return 'success'
    })

    await expect(fetchWithTimeout('https://does-not-matter', null, 1000)).rejects.toThrow()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith('https://does-not-matter', {
      signal: expect.any(AbortSignal),
    })
  })
})
