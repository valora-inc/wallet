import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import BeforeDepositBottomSheet from 'src/earn/poolInfoScreen/BeforeDepositBottomSheet'
import { CICOFlow } from 'src/fiatExchanges/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { createMockStore } from 'test/utils'
import { mockEarnPositions, mockTokenBalances } from 'test/values'

const mockPoolTokenId = mockEarnPositions[0].dataProps.depositTokenId
const mockToken = {
  ...mockTokenBalances[mockPoolTokenId],
  balance: new BigNumber(1),
  priceUsd: new BigNumber(1),
  lastKnownPriceUsd: new BigNumber(1),
}

jest.mock('src/statsig')

describe('BeforeDepositBottomSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAPS)
  })

  it.each`
    scenario                                                                            | expectedActions                                    | hasDepositToken | hasTokensOnSameNetwork | hasTokensOnOtherNetworks | canAdd   | poolCannotSwapAndDeposit | allowCrossChainSwaps
    ${'does not have any tokens'}                                                       | ${['Add', 'Transfer']}                             | ${false}        | ${false}               | ${false}                 | ${true}  | ${false}                 | ${true}
    ${'does not have any tokens, cannot buy'}                                           | ${['Transfer']}                                    | ${false}        | ${false}               | ${false}                 | ${false} | ${false}                 | ${true}
    ${'only has deposit token'}                                                         | ${['Deposit', 'AddMore']}                          | ${true}         | ${false}               | ${false}                 | ${true}  | ${false}                 | ${true}
    ${'only has deposit token, cannot buy'}                                             | ${['Deposit', 'Transfer']}                         | ${true}         | ${false}               | ${false}                 | ${false} | ${false}                 | ${true}
    ${'only has other tokens on same chain'}                                            | ${['SwapAndDeposit', 'Add']}                       | ${false}        | ${true}                | ${false}                 | ${true}  | ${false}                 | ${true}
    ${'only has other tokens on same chain, cannot buy'}                                | ${['SwapAndDeposit', 'Transfer']}                  | ${false}        | ${true}                | ${false}                 | ${false} | ${false}                 | ${true}
    ${'only has other tokens on same chain, pool cannot swap and deposit'}              | ${['Swap', 'Add']}                                 | ${false}        | ${true}                | ${false}                 | ${true}  | ${true}                  | ${true}
    ${'only has other tokens on same chain, pool cannot swap and deposit, cannot buy'}  | ${['Swap', 'Transfer']}                            | ${false}        | ${true}                | ${false}                 | ${false} | ${true}                  | ${true}
    ${'only has tokens on different chain'}                                             | ${['Swap', 'Add']}                                 | ${false}        | ${false}               | ${true}                  | ${true}  | ${false}                 | ${true}
    ${'only has tokens on different chain, cannot buy'}                                 | ${['Swap', 'Transfer']}                            | ${false}        | ${false}               | ${true}                  | ${false} | ${false}                 | ${true}
    ${'only has tokens on different chain, cross chain swap disabled'}                  | ${['Add', 'Transfer']}                             | ${false}        | ${false}               | ${true}                  | ${true}  | ${false}                 | ${false}
    ${'has deposit token and other tokens on same chain'}                               | ${['Deposit', 'SwapAndDeposit', 'AddMore']}        | ${true}         | ${true}                | ${false}                 | ${true}  | ${false}                 | ${true}
    ${'has deposit token and other tokens on same chain, cannot buy'}                   | ${['Deposit', 'SwapAndDeposit', 'Transfer']}       | ${true}         | ${true}                | ${false}                 | ${false} | ${false}                 | ${true}
    ${'has deposit token and other tokens on same chain, pool cannot swap and deposit'} | ${['Deposit', 'Swap', 'AddMore']}                  | ${true}         | ${true}                | ${false}                 | ${true}  | ${true}                  | ${true}
    ${'has deposit token and tokens on different chain, cross chain swap disabled'}     | ${['Deposit', 'AddMore']}                          | ${true}         | ${false}               | ${true}                  | ${true}  | ${false}                 | ${false}
    ${'has deposit token and tokens on different chain'}                                | ${['Deposit', 'Swap', 'AddMore']}                  | ${true}         | ${false}               | ${true}                  | ${true}  | ${false}                 | ${true}
    ${'has deposit token and tokens on different chain, cannot buy'}                    | ${['Deposit', 'Swap', 'Transfer']}                 | ${true}         | ${false}               | ${true}                  | ${false} | ${false}                 | ${true}
    ${'has other tokens on same and different chain'}                                   | ${['SwapAndDeposit', 'CrossChainSwap', 'Add']}     | ${false}        | ${true}                | ${true}                  | ${true}  | ${false}                 | ${true}
    ${'has other tokens on same and different chain, pool cannot swap and deposit'}     | ${['Swap', 'Add']}                                 | ${false}        | ${true}                | ${true}                  | ${true}  | ${true}                  | ${true}
    ${'has other tokens on same and different chain, cross chain swap disabled'}        | ${['SwapAndDeposit', 'Add']}                       | ${false}        | ${true}                | ${true}                  | ${true}  | ${false}                 | ${false}
    ${'has all types of tokens'}                                                        | ${['Deposit', 'SwapAndDeposit', 'CrossChainSwap']} | ${true}         | ${true}                | ${true}                  | ${true}  | ${false}                 | ${true}
    ${'has all types of tokens, pool cannot swap and deposit'}                          | ${['Deposit', 'Swap']}                             | ${true}         | ${true}                | ${true}                  | ${true}  | ${true}                  | ${true}
    ${'has all types of tokens, cross chain swap disabled'}                             | ${['Deposit', 'SwapAndDeposit', 'AddMore']}        | ${true}         | ${true}                | ${true}                  | ${true}  | ${false}                 | ${false}
    ${'has all types of tokens, cross chain swap disabled, cannot buy'}                 | ${['Deposit', 'SwapAndDeposit', 'Transfer']}       | ${true}         | ${true}                | ${true}                  | ${false} | ${false}                 | ${false}
    ${'has all types of tokens, cannot buy'}                                            | ${['Deposit', 'SwapAndDeposit', 'CrossChainSwap']} | ${true}         | ${true}                | ${true}                  | ${false} | ${false}                 | ${true}
  `(
    'shows correct title and actions when cross chain swap and deposit is disabled and user $scenario',
    ({
      hasDepositToken,
      hasTokensOnSameNetwork,
      hasTokensOnOtherNetworks,
      canAdd,
      expectedActions,
      poolCannotSwapAndDeposit,
      allowCrossChainSwaps,
    }: {
      hasDepositToken: boolean
      hasTokensOnSameNetwork: boolean
      hasTokensOnOtherNetworks: boolean
      canAdd: boolean
      expectedActions: string[]
      poolCannotSwapAndDeposit: boolean
      allowCrossChainSwaps: boolean
    }) => {
      jest
        .mocked(getFeatureGate)
        .mockImplementation(
          (gate) => gate === StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAPS && allowCrossChainSwaps
        )
      const { getAllByTestId, getByText, queryByTestId, queryByText } = render(
        <Provider store={createMockStore()}>
          <BeforeDepositBottomSheet
            forwardedRef={{ current: null }}
            token={mockToken}
            pool={{
              ...mockEarnPositions[0],
              availableShortcutIds: poolCannotSwapAndDeposit
                ? ['deposit', 'withdraw']
                : mockEarnPositions[0].availableShortcutIds,
            }}
            hasDepositToken={hasDepositToken}
            hasTokensOnSameNetwork={hasTokensOnSameNetwork}
            hasTokensOnOtherNetworks={hasTokensOnOtherNetworks}
            canAdd={canAdd}
            exchanges={[]}
          />
        </Provider>
      )
      expect(getAllByTestId(/^Earn\/ActionCard/).map((element) => element.props.testID)).toEqual(
        expectedActions.map((action) => `Earn/ActionCard/${action}`)
      )
      const canDeposit =
        expectedActions.includes('Deposit') || expectedActions.includes('SwapAndDeposit')
      expect(
        getByText(
          `earnFlow.beforeDepositBottomSheet.${canDeposit ? 'depositTitle' : 'beforeYouCanDepositTitle'}`
        )
      ).toBeTruthy()
      expect(!!queryByTestId('Earn/BeforeDepositBottomSheet/AlternativeDescription')).toBe(
        canDeposit
      )
      expect(
        !!queryByText(
          'earnFlow.beforeDepositBottomSheet.crossChainAlternativeDescription, {"tokenNetwork":"Arbitrum Sepolia"}'
        )
      ).toBe(canDeposit)
    }
  )

  // The has other tokens case either sets hasTokensOnSameNetwork or
  // hasTokensOnOtherNetworks to true, we don't need to test every combination individually
  it.each`
    scenario                                                                          | expectedActions                              | hasDepositToken | hasTokensOnSameNetwork | hasTokensOnOtherNetworks | canAdd   | poolCannotSwapAndDeposit
    ${'does not have any tokens'}                                                     | ${['Add', 'Transfer']}                       | ${false}        | ${false}               | ${false}                 | ${true}  | ${false}
    ${'does not have any tokens, cannot buy'}                                         | ${['Transfer']}                              | ${false}        | ${false}               | ${false}                 | ${false} | ${false}
    ${'only has deposit token'}                                                       | ${['Deposit', 'AddMore']}                    | ${true}         | ${false}               | ${false}                 | ${true}  | ${false}
    ${'only has deposit token, cannot buy'}                                           | ${['Deposit', 'Transfer']}                   | ${true}         | ${false}               | ${false}                 | ${false} | ${false}
    ${'only has other tokens'}                                                        | ${['SwapAndDeposit', 'Add']}                 | ${false}        | ${true}                | ${false}                 | ${true}  | ${false}
    ${'only has other tokens, cannot buy'}                                            | ${['SwapAndDeposit', 'Transfer']}            | ${false}        | ${false}               | ${true}                  | ${false} | ${false}
    ${'only has other tokens, pool cannot swap and deposit'}                          | ${['Swap', 'Add']}                           | ${false}        | ${true}                | ${false}                 | ${true}  | ${true}
    ${'only has other tokens, pool cannot swap and deposit, cannot buy'}              | ${['Swap', 'Transfer']}                      | ${false}        | ${true}                | ${true}                  | ${false} | ${true}
    ${'has deposit token and other tokens'}                                           | ${['Deposit', 'SwapAndDeposit', 'AddMore']}  | ${true}         | ${false}               | ${true}                  | ${true}  | ${false}
    ${'has deposit token and other tokens, cannot buy'}                               | ${['Deposit', 'SwapAndDeposit', 'Transfer']} | ${true}         | ${true}                | ${false}                 | ${false} | ${false}
    ${'has deposit token and other tokens, pool cannot swap and deposit'}             | ${['Deposit', 'Swap', 'AddMore']}            | ${true}         | ${true}                | ${true}                  | ${true}  | ${true}
    ${'has deposit token and other tokens, pool cannot swap and deposit, cannot buy'} | ${['Deposit', 'Swap', 'Transfer']}           | ${true}         | ${true}                | ${true}                  | ${false} | ${true}
  `(
    'shows correct title and actions when cross chain swap and deposit is enabled and user $scenario',
    ({
      hasDepositToken,
      hasTokensOnSameNetwork,
      hasTokensOnOtherNetworks,
      canAdd,
      expectedActions,
      poolCannotSwapAndDeposit,
    }: {
      hasDepositToken: boolean
      hasTokensOnSameNetwork: boolean
      hasTokensOnOtherNetworks: boolean
      canAdd: boolean
      expectedActions: string[]
      poolCannotSwapAndDeposit: boolean
    }) => {
      jest
        .mocked(getFeatureGate)
        .mockImplementation(
          (gate) =>
            gate === StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAP_AND_DEPOSIT ||
            gate === StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAPS
        )
      const { getAllByTestId, getByText, queryByTestId, queryByText } = render(
        <Provider store={createMockStore()}>
          <BeforeDepositBottomSheet
            forwardedRef={{ current: null }}
            token={mockToken}
            pool={{
              ...mockEarnPositions[0],
              availableShortcutIds: poolCannotSwapAndDeposit
                ? ['deposit', 'withdraw']
                : mockEarnPositions[0].availableShortcutIds,
            }}
            hasDepositToken={hasDepositToken}
            hasTokensOnSameNetwork={hasTokensOnSameNetwork}
            hasTokensOnOtherNetworks={hasTokensOnOtherNetworks}
            canAdd={canAdd}
            exchanges={[]}
          />
        </Provider>
      )
      expect(getAllByTestId(/^Earn\/ActionCard/).map((element) => element.props.testID)).toEqual(
        expectedActions.map((action) => `Earn/ActionCard/${action}`)
      )
      const canDeposit =
        expectedActions.includes('Deposit') || expectedActions.includes('SwapAndDeposit')
      expect(
        getByText(
          `earnFlow.beforeDepositBottomSheet.${canDeposit ? 'depositTitle' : 'beforeYouCanDepositTitle'}`
        )
      ).toBeTruthy()
      expect(!!queryByTestId('Earn/BeforeDepositBottomSheet/AlternativeDescription')).toBe(
        canDeposit
      )
      expect(!!queryByText('earnFlow.beforeDepositBottomSheet.alternativeDescription')).toBe(
        canDeposit
      )
    }
  )

  it('shows correct swap and deposit action description when cross chain swap and deposit is disabled', () => {
    const { getByTestId, getByText } = render(
      <Provider store={createMockStore()}>
        <BeforeDepositBottomSheet
          forwardedRef={{ current: null }}
          token={mockToken}
          pool={mockEarnPositions[0]}
          hasDepositToken={true}
          hasTokensOnSameNetwork={true}
          hasTokensOnOtherNetworks={true}
          canAdd={true}
          exchanges={[]}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/SwapAndDeposit')).toBeTruthy()
    expect(getByTestId('Earn/ActionCard/SwapAndDeposit')).toContainElement(
      getByText(
        'earnFlow.beforeDepositBottomSheet.action.swapAndDepositDescription, {"tokenNetwork":"Arbitrum Sepolia"}'
      )
    )
  })

  it('shows correct swap and deposit action description when cross chain swap and deposit is enabled', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (gate) =>
          gate === StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAP_AND_DEPOSIT ||
          gate === StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAPS
      )
    const { getByTestId, getByText } = render(
      <Provider store={createMockStore()}>
        <BeforeDepositBottomSheet
          forwardedRef={{ current: null }}
          token={mockToken}
          pool={mockEarnPositions[0]}
          hasDepositToken={true}
          hasTokensOnSameNetwork={true}
          hasTokensOnOtherNetworks={true}
          canAdd={true}
          exchanges={[]}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/SwapAndDeposit')).toBeTruthy()
    expect(getByTestId('Earn/ActionCard/SwapAndDeposit')).toContainElement(
      getByText('earnFlow.beforeDepositBottomSheet.action.swapAndDepositAllTokensDescription')
    )
  })

  it('navigates correctly when deposit action item is tapped', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <BeforeDepositBottomSheet
          forwardedRef={{ current: null }}
          token={mockToken}
          pool={mockEarnPositions[0]}
          hasDepositToken={true}
          hasTokensOnSameNetwork={true}
          hasTokensOnOtherNetworks={true}
          canAdd={true}
          exchanges={[]}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/Deposit')).toBeTruthy()
    fireEvent.press(getByTestId('Earn/ActionCard/Deposit'))
    expect(navigate).toHaveBeenCalledWith(Screens.EarnEnterAmount, {
      pool: mockEarnPositions[0],
    })
  })

  it('navigates correctly when swap and deposit action item is tapped', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <BeforeDepositBottomSheet
          forwardedRef={{ current: null }}
          token={mockToken}
          pool={mockEarnPositions[0]}
          hasDepositToken={true}
          hasTokensOnSameNetwork={true}
          hasTokensOnOtherNetworks={true}
          canAdd={true}
          exchanges={[]}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/SwapAndDeposit')).toBeTruthy()
    fireEvent.press(getByTestId('Earn/ActionCard/SwapAndDeposit'))
    expect(navigate).toHaveBeenCalledWith(Screens.EarnEnterAmount, {
      pool: mockEarnPositions[0],
      mode: 'swap-deposit',
    })
  })

  it('navigates correctly when cross chain swap action item is tapped', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <BeforeDepositBottomSheet
          forwardedRef={{ current: null }}
          token={mockToken}
          pool={mockEarnPositions[0]}
          hasDepositToken={true}
          hasTokensOnSameNetwork={true}
          hasTokensOnOtherNetworks={true}
          canAdd={true}
          exchanges={[]}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/CrossChainSwap')).toBeTruthy()
    fireEvent.press(getByTestId('Earn/ActionCard/CrossChainSwap'))
    expect(navigate).toHaveBeenCalledWith(Screens.SwapScreenWithBack, {
      toTokenId: mockEarnPositions[0].dataProps.depositTokenId,
    })
  })

  it('navigates correctly when add more action item is tapped', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <BeforeDepositBottomSheet
          forwardedRef={{ current: null }}
          token={mockToken}
          pool={mockEarnPositions[0]}
          hasDepositToken={true}
          hasTokensOnSameNetwork={false}
          hasTokensOnOtherNetworks={false}
          canAdd={true}
          exchanges={[]}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/AddMore')).toBeTruthy()
    fireEvent.press(getByTestId('Earn/ActionCard/AddMore'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      tokenId: mockEarnPositions[0].dataProps.depositTokenId,
      flow: CICOFlow.CashIn,
      tokenSymbol: 'USDC',
    })
  })

  it('navigates correctly when add action item is tapped', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <BeforeDepositBottomSheet
          forwardedRef={{ current: null }}
          token={mockToken}
          pool={mockEarnPositions[0]}
          hasDepositToken={false}
          hasTokensOnSameNetwork={false}
          hasTokensOnOtherNetworks={false}
          canAdd={true}
          exchanges={[]}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/Add')).toBeTruthy()
    fireEvent.press(getByTestId('Earn/ActionCard/Add'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      tokenId: mockEarnPositions[0].dataProps.depositTokenId,
      flow: CICOFlow.CashIn,
      tokenSymbol: 'USDC',
    })
  })

  it('navigates correctly when swap action item is tapped', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <BeforeDepositBottomSheet
          forwardedRef={{ current: null }}
          token={mockToken}
          pool={mockEarnPositions[0]}
          hasDepositToken={false}
          hasTokensOnSameNetwork={false}
          hasTokensOnOtherNetworks={true}
          canAdd={true}
          exchanges={[]}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/Swap')).toBeTruthy()
    fireEvent.press(getByTestId('Earn/ActionCard/Swap'))
    expect(navigate).toHaveBeenCalledWith(Screens.SwapScreenWithBack, {
      toTokenId: mockEarnPositions[0].dataProps.depositTokenId,
    })
  })

  it('navigates correctly when transfer action item is tapped', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <BeforeDepositBottomSheet
          forwardedRef={{ current: null }}
          token={mockToken}
          pool={mockEarnPositions[0]}
          hasDepositToken={false}
          hasTokensOnSameNetwork={false}
          hasTokensOnOtherNetworks={false}
          canAdd={true}
          exchanges={[]}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/Transfer')).toBeTruthy()
    fireEvent.press(getByTestId('Earn/ActionCard/Transfer'))
    expect(navigate).toHaveBeenCalledWith(Screens.ExchangeQR, {
      flow: CICOFlow.CashIn,
      exchanges: [],
    })
  })
})
