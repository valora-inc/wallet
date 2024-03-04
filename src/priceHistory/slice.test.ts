import reducer, {
  State,
  fetchPriceHistoryFailure,
  fetchPriceHistoryStart,
} from 'src/priceHistory/slice'
import { mockCusdTokenId } from 'test/values'

it('should handle fetchPriceHistoryStart', () => {
  const initialState: State = {}
  const action = fetchPriceHistoryStart({
    tokenId: mockCusdTokenId,
    startTimestamp: 0,
    endTimestamp: 1000,
  })
  const resultState = reducer(initialState, action)
  expect(resultState[mockCusdTokenId]).toEqual({ status: 'loading' })
})

it('should handle fetchPriceHistoryFailure', () => {
  const initialState: State = {
    [mockCusdTokenId]: {
      status: 'success',
      prices: [
        {
          priceFetchedAt: 1702615273456,
          priceUsd: '0.586264975645369',
        },
        {
          priceFetchedAt: 1702619113312,
          priceUsd: '0.586264975645369',
        },
      ],
    },
  }
  const action = fetchPriceHistoryFailure({
    tokenId: mockCusdTokenId,
  })

  const resultState = reducer(initialState, action)
  // Should retain existing prices on failure
  expect(resultState[mockCusdTokenId]).toEqual({
    prices: [
      {
        priceFetchedAt: 1702615273456,
        priceUsd: '0.586264975645369',
      },
      {
        priceFetchedAt: 1702619113312,
        priceUsd: '0.586264975645369',
      },
    ],
    status: 'error',
  })
})

it('should handle fetchPriceHistorySuccess', () => {
  const initialState: State = {
    [mockCusdTokenId]: {
      status: 'loading',
      prices: [],
    },
  }
  const action = {
    type: 'priceHistory/fetchPriceHistorySuccess',
    payload: {
      tokenId: mockCusdTokenId,
      prices: [
        {
          priceFetchedAt: 1702615273456,
          priceUsd: '0.586264975645369',
        },
        {
          priceFetchedAt: 1702619113312,
          priceUsd: '0.586264975645369',
        },
      ],
    },
  }

  const resultState = reducer(initialState, action)
  expect(resultState[mockCusdTokenId]).toEqual({
    prices: [
      {
        priceFetchedAt: 1702615273456,
        priceUsd: '0.586264975645369',
      },
      {
        priceFetchedAt: 1702619113312,
        priceUsd: '0.586264975645369',
      },
    ],
    status: 'success',
  })
})
