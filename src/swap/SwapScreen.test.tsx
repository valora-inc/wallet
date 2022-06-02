import { FetchMock } from 'jest-fetch-mock/types'

jest.mock('src/swap/ExchangeAssetField', () => 'ExchangeAssetField')
jest.mock('src/swap/TokenSelectionButton', () => 'TokenSelectionButton')
jest.mock('src/swap/SwapTokenList', () => 'SwapTokenList')
jest.mock('src/swap/TokenListItem', () => 'TokenListItem')

describe('SwapScreen', () => {
  const mockFetch: FetchMock = fetch as FetchMock
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    mockFetch.mockResponse(
      JSON.stringify({
        data: {
          tokens: [],
        },
      })
    )
  })

  describe('Initial State', () => {
    it.todo("renders correctly on user's first visit")
    it.todo('renders correctly when user only selects asset in')
    it.todo('renders correctly when user only selects asset out')
    it.todo('renders correctly when user selects both assets')
  })

  describe('Subsequent Visits', () => {
    it.todo("renders the user's previously saved swap selections")
  })
})
