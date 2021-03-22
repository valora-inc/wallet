import { Actions } from 'src/fiatExchanges/actions'
import {
  CiCoProvider,
  initialState,
  providersDisplayInfo,
  reducer,
} from 'src/fiatExchanges/reducer'

describe('fiat exchange reducer', () => {
  it('should return the initial state', () => {
    // @ts-ignore
    expect(reducer(undefined, {})).toEqual(initialState)
  })

  it('SELECT_PROVIDER should override the provider', () => {
    let updatedState = reducer(undefined, {
      type: Actions.SELECT_PROVIDER,
      provider: CiCoProvider.Moonpay,
    })
    expect(updatedState).toEqual({
      ...initialState,
      lastUsedProvider: CiCoProvider.Moonpay,
    })

    updatedState = reducer(updatedState, {
      type: Actions.SELECT_PROVIDER,
      provider: CiCoProvider.Simplex,
    })
    expect(updatedState).toEqual({
      ...initialState,
      lastUsedProvider: CiCoProvider.Simplex,
    })
  })

  it('ASSIGN_PROVIDER_TO_TX_HASH assigns and clears last provider correctly', () => {
    const currencyCode = 'cUSD'
    const txHash1 = '0x4607df6d11e63bb024cf1001956de7b6bd7adc253146f8412e8b3756752b8353'
    const txHash2 = '0x16fbd53c4871f0657f40e1b4515184be04bed8912c6e2abc2cda549e4ad8f852'

    let updatedState = reducer(undefined, {
      type: Actions.ASSIGN_PROVIDER_TO_TX_HASH,
      txHash: txHash1,
      currencyCode,
    })

    expect(updatedState).toEqual({
      ...initialState,
      txHashToProvider: {
        [txHash1]: {
          name: 'fiatExchangeFlow:cUsdDeposit',
          icon: expect.any(String),
        },
      },
    })

    updatedState = reducer(updatedState, {
      type: Actions.SELECT_PROVIDER,
      provider: CiCoProvider.Moonpay,
    })
    updatedState = reducer(updatedState, {
      type: Actions.ASSIGN_PROVIDER_TO_TX_HASH,
      txHash: txHash2,
      currencyCode,
    })

    expect(updatedState).toEqual({
      ...initialState,
      lastUsedProvider: null,
      txHashToProvider: {
        [txHash1]: {
          name: 'fiatExchangeFlow:cUsdDeposit',
          icon: expect.any(String),
        },
        [txHash2]: providersDisplayInfo[CiCoProvider.Moonpay],
      },
    })
  })

  it("ASSIGN_PROVIDER_TO_TX_HASH doesn't override tx hashes", () => {
    const currencyCode = 'cUSD'
    const txHash1 = '0x4607df6d11e63bb024cf1001956de7b6bd7adc253146f8412e8b3756752b8353'

    let updatedState = reducer(initialState, {
      type: Actions.SELECT_PROVIDER,
      provider: CiCoProvider.Moonpay,
    })
    updatedState = reducer(updatedState, {
      type: Actions.ASSIGN_PROVIDER_TO_TX_HASH,
      txHash: txHash1,
      currencyCode,
    })
    // Now, overwriting Moonpay with Simplex should casue no effect.
    updatedState = reducer(updatedState, {
      type: Actions.SELECT_PROVIDER,
      provider: CiCoProvider.Simplex,
    })
    updatedState = reducer(updatedState, {
      type: Actions.ASSIGN_PROVIDER_TO_TX_HASH,
      txHash: txHash1,
      currencyCode,
    })

    expect(updatedState).toEqual({
      ...initialState,
      lastUsedProvider: CiCoProvider.Simplex,
      txHashToProvider: {
        [txHash1]: providersDisplayInfo[CiCoProvider.Moonpay],
      },
    })
  })

  it('SET_PROVIDERS_FOR_TX_HASHES overwrites any pre-existing mappings', () => {
    const currencyCode = 'cUSD'
    const txHash1 = '0x4607df6d11e63bb024cf1001956de7b6bd7adc253146f8412e8b3756752b8353'

    // First, set Moonpay as the provider.
    let updatedState = reducer(initialState, {
      type: Actions.SELECT_PROVIDER,
      provider: CiCoProvider.Moonpay,
    })
    updatedState = reducer(updatedState, {
      type: Actions.ASSIGN_PROVIDER_TO_TX_HASH,
      txHash: txHash1,
      currencyCode,
    })
    // Then, overwrite it with the data that comes from Firebase.
    updatedState = reducer(updatedState, {
      type: Actions.SET_PROVIDERS_FOR_TX_HASHES,
      txHashes: { [txHash1]: CiCoProvider.Simplex },
    })

    expect(updatedState).toEqual({
      ...initialState,
      lastUsedProvider: null,
      txHashToProvider: {
        [txHash1]: providersDisplayInfo[CiCoProvider.Simplex],
      },
    })
  })
})
