import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import { WalletHome } from 'src/home/WalletHome'
import { Currency } from 'src/utils/currencies'
import { createMockStore, createMockStoreAppDisconnected, getMockI18nProps } from 'test/utils'

const TWO_DAYS_MS = 2 * 24 * 60 * 1000

const storeData = {
  goldToken: { educationCompleted: true },
  account: {
    backupCompleted: true,
    dismissedInviteFriends: true,
    accountCreationTime: new Date().getTime() - TWO_DAYS_MS,
    paymentRequests: [],
  },
}

const balances = {
  [Currency.Dollar]: new BigNumber(20.02),
  [Currency.Celo]: new BigNumber(20),
  [Currency.Euro]: new BigNumber(10),
}

const zeroBalances = {
  [Currency.Dollar]: new BigNumber(0),
  [Currency.Celo]: new BigNumber(0),
  [Currency.Euro]: new BigNumber(0),
}

jest.mock('src/exchange/CeloGoldOverview')
jest.mock('src/transactions/TransactionsList')

describe('Testnet banner', () => {
  it('Shows testnet banner for 5 seconds', async () => {
    const store = createMockStore({
      ...storeData,
      account: {
        backupCompleted: false,
      },
    })
    const showMessageMock = jest.fn()
    const tree = render(
      <Provider store={store}>
        <WalletHome
          refreshAllBalances={jest.fn()}
          initializeSentryUserContext={jest.fn()}
          setLoading={jest.fn()}
          showMessage={showMessageMock}
          loading={false}
          recipientCache={{}}
          numberVerified={true}
          importContacts={jest.fn()}
          balances={balances}
          cashInButtonExpEnabled={false}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    expect(showMessageMock).toHaveBeenCalledWith(
      'testnetAlert.1, {"testnet":"Alfajores"}',
      5000,
      null,
      null,
      'testnetAlert.0, {"testnet":"Alfajores"}'
    )
  })
  it('Renders when disconnected', async () => {
    const store = createMockStoreAppDisconnected()
    const tree = render(
      <Provider store={store}>
        <WalletHome
          refreshAllBalances={jest.fn()}
          initializeSentryUserContext={jest.fn()}
          setLoading={jest.fn()}
          showMessage={jest.fn()}
          loading={false}
          recipientCache={{}}
          numberVerified={true}
          importContacts={jest.fn()}
          balances={balances}
          cashInButtonExpEnabled={false}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('Renders when connected with backup complete', async () => {
    const store = createMockStore()
    const tree = render(
      <Provider store={store}>
        <WalletHome
          refreshAllBalances={jest.fn()}
          initializeSentryUserContext={jest.fn()}
          setLoading={jest.fn()}
          showMessage={jest.fn()}
          loading={false}
          recipientCache={{}}
          numberVerified={true}
          importContacts={jest.fn()}
          balances={balances}
          cashInButtonExpEnabled={false}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('Renders cash in bottom sheet when experiment flag is turned on and balances are zero', async () => {
    const store = createMockStore()
    const tree = render(
      <Provider store={store}>
        <WalletHome
          refreshAllBalances={jest.fn()}
          initializeSentryUserContext={jest.fn()}
          setLoading={jest.fn()}
          showMessage={jest.fn()}
          loading={false}
          recipientCache={{}}
          numberVerified={true}
          importContacts={jest.fn()}
          balances={zeroBalances}
          cashInButtonExpEnabled={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
