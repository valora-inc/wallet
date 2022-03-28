import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { SupportedActions } from 'src/walletConnect/constants'
import { handleRequest } from 'src/walletConnect/request'
import { getWallet } from 'src/web3/contracts'
import { unlockAccount } from 'src/web3/saga'
import { createMockStore } from 'test/utils'
import { mockCeloAddress, mockCeurAddress, mockCusdAddress, mockWallet } from 'test/values'

const signTransactionRequest = {
  method: SupportedActions.eth_signTransaction,
  params: [{ from: '0xTEST' }],
}
const personalSignRequest = {
  method: SupportedActions.personal_sign,
  params: ['Some message', '0xdeadbeef'],
}
const signTypedDataRequest = {
  method: SupportedActions.eth_signTypedData,
  params: ['0xdeadbeef', JSON.stringify({ message: 'Some typed data' })],
}
const signTypedDataV4Request = {
  method: SupportedActions.eth_signTypedData_v4,
  params: ['0xdeadbeef', JSON.stringify({ message: 'Some typed data' })],
}

const state = createMockStore({
  web3: { account: '0xWALLET', mtwAddress: undefined },
  tokens: {
    tokenBalances: {
      [mockCusdAddress]: {
        balance: '00',
        usdPrice: '1',
        symbol: 'cUSD',
        address: mockCusdAddress,
        isCoreToken: true,
        priceFetchedAt: Date.now(),
      },
      [mockCeurAddress]: {
        balance: '0',
        usdPrice: '1.2',
        symbol: 'cEUR',
        address: mockCeurAddress,
        isCoreToken: true,
        priceFetchedAt: Date.now(),
      },
      [mockCeloAddress]: {
        balance: '5',
        usdPrice: '3.5',
        symbol: 'CELO',
        address: mockCeloAddress,
        isCoreToken: true,
        priceFetchedAt: Date.now(),
      },
    },
  },
}).getState()

describe(handleRequest, () => {
  it('unlocks the wallet address when a MTW address is set', async () => {
    const state = createMockStore({ web3: { account: '0xWALLET', mtwAddress: '0xMTW' } }).getState()
    await expectSaga(handleRequest, signTransactionRequest)
      .provide([[call(getWallet), mockWallet]])
      .withState(state)
      .call(unlockAccount, '0xwallet')
      .run()
  })

  it('unlocks the wallet address when a MTW address is NOT set', async () => {
    const state = createMockStore({
      web3: { account: '0xWALLET', mtwAddress: undefined },
    }).getState()
    await expectSaga(handleRequest, signTransactionRequest)
      .provide([[call(getWallet), mockWallet]])
      .withState(state)
      .call(unlockAccount, '0xwallet')
      .run()
  })

  it('supports personal_sign', async () => {
    await expectSaga(handleRequest, personalSignRequest)
      .provide([[call(getWallet), mockWallet]])
      .withState(state)
      .call(unlockAccount, '0xwallet')
      .call([mockWallet, 'signPersonalMessage'], '0xwallet', 'Some message')
      .run()
  })

  it('supports eth_signTypedData', async () => {
    await expectSaga(handleRequest, signTypedDataRequest)
      .provide([[call(getWallet), mockWallet]])
      .withState(state)
      .call(unlockAccount, '0xwallet')
      .call([mockWallet, 'signTypedData'], '0xwallet', { message: 'Some typed data' })
      .run()
  })

  it('supports eth_signTypedData_v4', async () => {
    await expectSaga(handleRequest, signTypedDataV4Request)
      .provide([[call(getWallet), mockWallet]])
      .withState(state)
      .call(unlockAccount, '0xwallet')
      .call([mockWallet, 'signTypedData'], '0xwallet', { message: 'Some typed data' })
      .run()
  })

  describe('eth_signTransaction', () => {
    describe('transaction normalization', () => {
      it('ensures chainId, feeCurrency, gas, gasPrice and nonce are added if not set', async () => {
        await expectSaga(handleRequest, {
          method: SupportedActions.eth_signTransaction,
          params: [{ from: '0xTEST', data: '0xABC' }],
        })
          .provide([[call(getWallet), mockWallet]])
          .withState(state)
          .call(unlockAccount, '0xwallet')
          .call([mockWallet, 'signTransaction'], {
            from: '0xTEST',
            data: '0xABC',
            feeCurrency: undefined, // undefined to pay with CELO, since the balance is non zero
            gas: 1000000,
            gasPrice: '3',
            chainId: '0xaef3', // 44787 as a hex string
            nonce: 7,
          })
          .run()
      })

      it('ensures normalization is skipped when __skip_normalization is set', async () => {
        await expectSaga(handleRequest, {
          method: SupportedActions.eth_signTransaction,
          params: [{ from: '0xTEST', data: '0xABC', __skip_normalization: true }],
        })
          .provide([[call(getWallet), mockWallet]])
          .withState(state)
          .call(unlockAccount, '0xwallet')
          .call([mockWallet, 'signTransaction'], { from: '0xTEST', data: '0xABC' })
          .run()
      })

      it('ensures gas is padded and gasPrice recalculated when feeCurrency is not set (or was stripped) and the new feeCurrency is non-CELO', async () => {
        // This is because WalletConnect v1 utils strips away feeCurrency

        const state = createMockStore({
          web3: { account: '0xWALLET', mtwAddress: undefined },
          tokens: {
            tokenBalances: {
              [mockCusdAddress]: {
                balance: '10',
                usdPrice: '1',
                symbol: 'cUSD',
                address: mockCusdAddress,
                isCoreToken: true,
                priceFetchedAt: Date.now(),
              },
              [mockCeurAddress]: {
                balance: '0',
                usdPrice: '1.2',
                symbol: 'cEUR',
                address: mockCeurAddress,
                isCoreToken: true,
                priceFetchedAt: Date.now(),
              },
              [mockCeloAddress]: {
                balance: '0',
                usdPrice: '3.5',
                symbol: 'CELO',
                address: mockCeloAddress,
                isCoreToken: true,
                priceFetchedAt: Date.now(),
              },
            },
          },
        }).getState()

        await expectSaga(handleRequest, {
          method: SupportedActions.eth_signTransaction,
          params: [{ from: '0xTEST', data: '0xABC', gas: 1, gasPrice: 2, nonce: 3 }],
        })
          .provide([[call(getWallet), mockWallet]])
          .withState(state)
          .call(unlockAccount, '0xwallet')
          .call([mockWallet, 'signTransaction'], {
            from: '0xTEST',
            data: '0xABC',
            feeCurrency: mockCusdAddress,
            gas: 50001, // 1 + STATIC_GAS_PADDING
            gasPrice: '3',
            chainId: '0xaef3', // 44787 as a hex string
            nonce: 3,
          })
          .run()
      })

      it('ensures gas is NOT padded and gasPrice is recalculated when feeCurrency is not set (or was stripped) and the new feeCurrency is CELO', async () => {
        // This is because WalletConnect v1 utils strips away feeCurrency
        await expectSaga(handleRequest, {
          method: SupportedActions.eth_signTransaction,
          params: [{ from: '0xTEST', data: '0xABC', gas: 1, gasPrice: 2, nonce: 3 }],
        })
          .provide([[call(getWallet), mockWallet]])
          .withState(state)
          .call(unlockAccount, '0xwallet')
          .call([mockWallet, 'signTransaction'], {
            from: '0xTEST',
            data: '0xABC',
            feeCurrency: undefined, // undefined to pay with CELO, since the balance is non zero
            gas: 1,
            gasPrice: '3',
            chainId: '0xaef3', // 44787 as a hex string
            nonce: 3,
          })
          .run()
      })

      it('ensures chainId, feeCurrency, gas, gasPrice and nonce are kept when provided', async () => {
        const txParams = {
          from: '0xTEST',
          data: '0xABC',
          chainId: 45000,
          feeCurrency: mockCusdAddress,
          gas: 1,
          gasPrice: 2,
          nonce: 3,
        }
        await expectSaga(handleRequest, {
          method: SupportedActions.eth_signTransaction,
          params: [txParams],
        })
          .provide([[call(getWallet), mockWallet]])
          .withState(state)
          .call(unlockAccount, '0xwallet')
          .call([mockWallet, 'signTransaction'], {
            from: '0xTEST',
            data: '0xABC',
            chainId: '0xafc8', // 45000 as a hex string
            feeCurrency: mockCusdAddress,
            gas: 1,
            gasPrice: 2,
            nonce: 3,
          })
          .run()
      })

      it('ensures feeCurrency is set to a token which has a balance, when not provided', async () => {
        const state = createMockStore({
          web3: { account: '0xWALLET', mtwAddress: undefined },
          tokens: {
            tokenBalances: {
              [mockCusdAddress]: {
                balance: '0',
                usdPrice: '1',
                symbol: 'cUSD',
                address: mockCusdAddress,
                isCoreToken: true,
                priceFetchedAt: Date.now(),
              },
              [mockCeurAddress]: {
                balance: '10',
                usdPrice: '1.2',
                symbol: 'cEUR',
                address: mockCeurAddress,
                isCoreToken: true,
                priceFetchedAt: Date.now(),
              },
              [mockCeloAddress]: {
                balance: '0',
                usdPrice: '3.5',
                symbol: 'CELO',
                address: mockCeloAddress,
                isCoreToken: true,
                priceFetchedAt: Date.now(),
              },
            },
          },
        }).getState()

        await expectSaga(handleRequest, {
          method: SupportedActions.eth_signTransaction,
          params: [{ from: '0xTEST', data: '0xABC' }],
        })
          .provide([[call(getWallet), mockWallet]])
          .withState(state)
          .call(unlockAccount, '0xwallet')
          .call([mockWallet, 'signTransaction'], {
            from: '0xTEST',
            data: '0xABC',
            feeCurrency: mockCeurAddress,
            gas: 1000000,
            gasPrice: '3',
            chainId: '0xaef3', // 44787 as a hex string
            nonce: 7,
          })
          .run()
      })
    })
  })
})
