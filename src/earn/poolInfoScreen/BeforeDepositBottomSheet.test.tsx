import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import BeforeDepositBottomSheet from 'src/earn/poolInfoScreen/BeforeDepositBottomSheet'
import { CICOFlow } from 'src/fiatExchanges/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockEarnPositions, mockTokenBalances } from 'test/values'

const mockPoolTokenId = mockEarnPositions[0].dataProps.depositTokenId
const mockToken = {
  ...mockTokenBalances[mockPoolTokenId],
  balance: new BigNumber(1),
  priceUsd: new BigNumber(1),
  lastKnownPriceUsd: new BigNumber(1),
}

describe('BeforeDepositBottomSheet', () => {
  it('show bottom sheet correctly when hasDepositToken is true, no other tokens', () => {
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
    expect(getByTestId('Earn/ActionCard/Deposit')).toBeTruthy()
    expect(getByTestId('Earn/ActionCard/AddMore')).toBeTruthy()
  })
  it('show bottom sheet correctly when hasDepositToken is true, token(s) on same chain', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <BeforeDepositBottomSheet
          forwardedRef={{ current: null }}
          token={mockToken}
          pool={mockEarnPositions[0]}
          hasDepositToken={true}
          hasTokensOnSameNetwork={true}
          hasTokensOnOtherNetworks={false}
          canAdd={true}
          exchanges={[]}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/Deposit')).toBeTruthy()
    expect(getByTestId('Earn/ActionCard/SwapAndDeposit')).toBeTruthy()
    expect(getByTestId('Earn/ActionCard/AddMore')).toBeTruthy()
  })
  it('show bottom sheet correctly when hasDepositToken is true, token(s) on differnet chain', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <BeforeDepositBottomSheet
          forwardedRef={{ current: null }}
          token={mockToken}
          pool={mockEarnPositions[0]}
          hasDepositToken={true}
          hasTokensOnSameNetwork={false}
          hasTokensOnOtherNetworks={true}
          canAdd={true}
          exchanges={[]}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/Deposit')).toBeTruthy()
    expect(getByTestId('Earn/ActionCard/Swap')).toBeTruthy()
    expect(getByTestId('Earn/ActionCard/AddMore')).toBeTruthy()
  })
  it('show bottom sheet correctly when hasDepositToken is true, token(s) on same and different chains', () => {
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
    expect(getByTestId('Earn/ActionCard/SwapAndDeposit')).toBeTruthy()
    expect(getByTestId('Earn/ActionCard/CrossChainSwap')).toBeTruthy()
  })
  it('show bottom sheet correctly when hasDepositToken is false, can same and cross chain swap', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <BeforeDepositBottomSheet
          forwardedRef={{ current: null }}
          token={mockToken}
          pool={mockEarnPositions[0]}
          hasDepositToken={false}
          hasTokensOnSameNetwork={true}
          hasTokensOnOtherNetworks={true}
          canAdd={true}
          exchanges={[]}
        />
      </Provider>
    )
    expect(getByTestId('Earn/ActionCard/SwapAndDeposit')).toBeTruthy()
    expect(getByTestId('Earn/ActionCard/CrossChainSwap')).toBeTruthy()
    expect(getByTestId('Earn/ActionCard/Add')).toBeTruthy()
  })

  it('show bottom sheet correctly when hasDepositToken is false, can cross chain swap', () => {
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
    expect(getByTestId('Earn/ActionCard/Add')).toBeTruthy()
  })

  it('show bottom sheet correctly when hasDepositToken is false, no tokens', () => {
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
    expect(getByTestId('Earn/ActionCard/Transfer')).toBeTruthy()
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
