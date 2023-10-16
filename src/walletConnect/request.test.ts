import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga/effects'
import { NetworkId } from 'src/transactions/types'
import { SupportedActions } from 'src/walletConnect/constants'
import { handleRequest } from 'src/walletConnect/request'
import { getViemWallet, getWallet } from 'src/web3/contracts'
import { unlockAccount } from 'src/web3/saga'
import { createMockStore } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockViemWallet,
  mockWallet,
} from 'test/values'

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

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
      [mockCusdTokenId]: {
        balance: '00',
        priceUsd: '1',
        symbol: 'cUSD',
        address: mockCusdAddress,
        tokenId: mockCusdTokenId,
        networkId: NetworkId['celo-alfajores'],
        isCoreToken: true,
        priceFetchedAt: Date.now(),
      },
      [mockCeurTokenId]: {
        balance: '0',
        priceUsd: '1.2',
        symbol: 'cEUR',
        address: mockCeurAddress,
        tokenId: mockCeurTokenId,
        networkId: NetworkId['celo-alfajores'],
        isCoreToken: true,
        priceFetchedAt: Date.now(),
      },
      [mockCeloTokenId]: {
        balance: '5',
        priceUsd: '3.5',
        symbol: 'CELO',
        address: mockCeloAddress,
        tokenId: mockCeloTokenId,
        networkId: NetworkId['celo-alfajores'],
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
      .provide([[matchers.call.fn(getViemWallet), mockViemWallet]])
      .withState(state)
      .call([mockViemWallet, 'signMessage'], { message: { raw: 'Some message' } })
      .run()
  })

  it('supports eth_signTypedData', async () => {
    await expectSaga(handleRequest, signTypedDataRequest)
      .provide([[matchers.call.fn(getViemWallet), mockViemWallet]])
      .withState(state)
      .call([mockViemWallet, 'signTypedData'], { message: 'Some typed data' })
      .run()
  })

  it('supports eth_signTypedData_v4', async () => {
    await expectSaga(handleRequest, signTypedDataV4Request)
      .provide([[matchers.call.fn(getViemWallet), mockViemWallet]])
      .withState(state)
      .call([mockViemWallet, 'signTypedData'], { message: 'Some typed data' })
      .run()
  })

  describe('eth_signTransaction', () => {
    describe('transaction normalization', () => {
      it('ensures `gasLimit` value is used in `gas` parameter', async () => {
        await expectSaga(handleRequest, {
          method: SupportedActions.eth_signTransaction,
          params: [{ from: '0xTEST', data: '0xABC', gasLimit: '0x5208' }],
        })
          .provide([[matchers.call.fn(getViemWallet), mockViemWallet]])
          .withState(state)
          .call([mockViemWallet, 'prepareTransactionRequest'], {
            from: '0xTEST',
            data: '0xABC',
            blockHash: null,
            blockNumber: null,
            chainId: undefined,
            gas: BigInt(21000),
            gasPrice: undefined,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            nonce: undefined,
            to: null,
            transactionIndex: null,
            type: undefined,
            typeHex: undefined,
            value: undefined,
            v: undefined,
          })
          .run()
      })

      it('ensures `gasPrice` is stripped away before preparing transaction request', async () => {
        await expectSaga(handleRequest, {
          method: SupportedActions.eth_signTransaction,
          params: [{ from: '0xTEST', data: '0xABC', gasPrice: '0x5208' }],
        })
          .provide([[matchers.call.fn(getViemWallet), mockViemWallet]])
          .withState(state)
          .call([mockViemWallet, 'prepareTransactionRequest'], {
            from: '0xTEST',
            data: '0xABC',
            blockHash: null,
            blockNumber: null,
            chainId: undefined,
            gas: undefined,
            gasPrice: undefined,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            nonce: undefined,
            to: null,
            transactionIndex: null,
            type: undefined,
            typeHex: undefined,
            value: undefined,
            v: undefined,
          })
          .run()
      })

      it('ensures normalization is skipped when __skip_normalization is set', async () => {
        await expectSaga(handleRequest, {
          method: SupportedActions.eth_signTransaction,
          params: [
            {
              from: '0xTEST',
              data: '0xABC',
              gasLimit: '0x5208',
              gasPrice: '0x5208',
              __skip_normalization: true,
            },
          ],
        })
          .provide([[matchers.call.fn(getViemWallet), mockViemWallet]])
          .withState(state)
          .call([mockViemWallet, 'prepareTransactionRequest'], {
            from: '0xTEST',
            data: '0xABC',
            blockHash: null,
            blockNumber: null,
            chainId: undefined,
            gas: undefined,
            gasLimit: '0x5208',
            gasPrice: BigInt(21000),
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            nonce: undefined,
            to: null,
            transactionIndex: null,
            type: undefined,
            typeHex: undefined,
            value: undefined,
            v: undefined,
          })
          .run()
      })
    })
  })
})
