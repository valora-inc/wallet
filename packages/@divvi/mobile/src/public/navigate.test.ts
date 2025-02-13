import { getMockStoreData } from 'test/utils'
import { mockAaveArbUsdcTokenId, mockTokenBalances, mockUSDCTokenId } from 'test/values'
import { CICOFlow, FiatExchangeFlow } from '../fiatExchanges/types'
import { navigate as internalNavigate } from '../navigator/NavigationService'
import { Screens } from '../navigator/Screens'
import { store } from '../redux/store'
import { navigate } from './navigate'

jest.mock('../navigator/NavigationService')

jest.mock('../redux/store', () => ({ store: { getState: jest.fn() } }))

const mockStore = jest.mocked(store)
mockStore.getState.mockImplementation(() =>
  getMockStoreData({
    tokens: {
      tokenBalances: {
        ...mockTokenBalances,
      },
    },
  })
)

// Note: when adding a new public route, add a test for it only if it's a non trivial mapping to an internal screen
describe('navigate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // This is a sanity check to ensure that the navigate function is type-safe
  // Using a couple of examples is enough.
  it('should type check navigation parameters', () => {
    // These should compile without type errors
    navigate('Swap')
    navigate('Swap', undefined)
    navigate('Swap', {
      fromTokenId: 'token1',
    })
    navigate('Swap', {
      fromTokenId: 'token1',
      toTokenId: 'token2',
      toTokenNetworkId: 'celo-mainnet',
    })

    // @ts-expect-error - Invalid parameter
    navigate('Swap', { invalidParam: 'foo' })

    // @ts-expect-error - Extra invalid parameter
    navigate('Swap', { fromTokenId: 'token1', invalidParam: 'foo' })

    // Just to have an assertion and avoid linting error
    expect(internalNavigate).toHaveBeenCalled()
  })

  describe('Swap', () => {
    it('should navigate to swap screen without params', () => {
      navigate('Swap')

      expect(internalNavigate).toHaveBeenCalledWith(Screens.SwapScreenWithBack, undefined)
    })

    it('should navigate to swap screen with valid params', () => {
      navigate('Swap', {
        fromTokenId: 'token1',
        toTokenId: 'token2',
        toTokenNetworkId: 'celo-mainnet',
      })

      expect(internalNavigate).toHaveBeenCalledWith(Screens.SwapScreenWithBack, {
        fromTokenId: 'token1',
        toTokenId: 'token2',
        toTokenNetworkId: 'celo-mainnet',
      })
    })
  })

  describe('Add', () => {
    it('should navigate to FiatExchangeAmount for cash-in eligible token', () => {
      const tokenId = mockUSDCTokenId
      navigate('Add', { tokenId })

      expect(internalNavigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
        tokenId,
        flow: CICOFlow.CashIn,
        tokenSymbol: 'USDC',
      })
    })

    it('should navigate to FiatExchangeCurrencyBottomSheet for cash-in ineligible token', () => {
      const tokenId = mockAaveArbUsdcTokenId
      navigate('Add', { tokenId })

      expect(internalNavigate).toHaveBeenCalledWith(Screens.FiatExchangeCurrencyBottomSheet, {
        flow: FiatExchangeFlow.CashIn,
      })
    })

    it('should navigate to FiatExchangeCurrencyBottomSheet when no tokenId is provided', () => {
      navigate('Add')

      expect(internalNavigate).toHaveBeenCalledWith(Screens.FiatExchangeCurrencyBottomSheet, {
        flow: FiatExchangeFlow.CashIn,
      })
    })
  })

  describe('Custom', () => {
    it('should allow navigation to custom screens', () => {
      // Using type assertion to simulate a custom screen
      navigate('CustomScreen' as any)

      expect(internalNavigate).toHaveBeenCalledWith('CustomScreen', undefined)
    })

    it('should allow navigation to custom screens with params', () => {
      navigate('CustomScreenWithParams' as any, { customParam: 'test' } as any)

      expect(internalNavigate).toHaveBeenCalledWith('CustomScreenWithParams', {
        customParam: 'test',
      })
    })
  })
})
