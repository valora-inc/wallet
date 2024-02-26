import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { NetworkId } from 'src/transactions/types'
import { ViemWallet } from 'src/viem/getLockableWallet'
import {
  SerializableTransactionRequest,
  getPreparedTransaction,
} from 'src/viem/preparedTransactionSerialization'
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
  mockTypedData,
  mockWallet,
} from 'test/values'
import { celoAlfajores, sepolia as ethereumSepolia } from 'viem/chains'

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
  request: {
    method: SupportedActions.eth_signTransaction,
    params: [{ from: '0xTEST', to: '0xTEST', data: '0x', nonce: 7, gas: '0x5208', value: '0x01' }],
  },
  chainId: 'eip155:44787',
}
const serializableTransactionRequest = signTransactionRequest.request
  .params[0] as SerializableTransactionRequest
const sendTransactionRequest = {
  request: {
    method: SupportedActions.eth_sendTransaction,
    params: [{ from: '0xTEST', to: '0xTEST', data: '0x', nonce: 7, gas: '0x5208', value: '0x01' }],
  },
  chainId: 'eip155:44787',
}
const serializableSendTransactionRequest = sendTransactionRequest.request
  .params[0] as SerializableTransactionRequest
const personalSignRequest = {
  request: {
    method: SupportedActions.personal_sign,
    params: ['Some message', '0xdeadbeef'],
  },
  chainId: 'eip155:44787',
}
const signTypedDataRequest = {
  request: {
    method: SupportedActions.eth_signTypedData,
    params: ['0xdeadbeef', JSON.stringify(mockTypedData)],
  },
  chainId: 'eip155:44787',
}
const signTypedDataV4Request = {
  request: {
    method: SupportedActions.eth_signTypedData_v4,
    params: ['0xdeadbeef', JSON.stringify(mockTypedData)],
  },
  chainId: 'eip155:44787',
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
        isFeeCurrency: true,
        priceFetchedAt: Date.now(),
      },
      [mockCeurTokenId]: {
        balance: '0',
        priceUsd: '1.2',
        symbol: 'cEUR',
        address: mockCeurAddress,
        tokenId: mockCeurTokenId,
        networkId: NetworkId['celo-alfajores'],
        isFeeCurrency: true,
        priceFetchedAt: Date.now(),
      },
      [mockCeloTokenId]: {
        balance: '5',
        priceUsd: '3.5',
        symbol: 'CELO',
        address: mockCeloAddress,
        tokenId: mockCeloTokenId,
        networkId: NetworkId['celo-alfajores'],
        isFeeCurrency: true,
        priceFetchedAt: Date.now(),
      },
    },
  },
}).getState()

describe(handleRequest, () => {
  let viemWallet: Partial<ViemWallet>

  beforeAll(function* () {
    viemWallet = yield* getViemWallet(celoAlfajores)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('chooses the correct wallet for the request', async () => {
    await expectSaga(handleRequest, { ...personalSignRequest, chainId: 'eip155:11155111' })
      .withState(state)
      .call(getViemWallet, ethereumSepolia)
      .not.call(getViemWallet, celoAlfajores)
      .run()

    await expectSaga(handleRequest, { ...personalSignRequest, chainId: 'eip155:44787' })
      .withState(state)
      .call(getViemWallet, celoAlfajores)
      .not.call(getViemWallet, ethereumSepolia)
      .run()
  })

  it('supports personal_sign, including for an unsupported chain', async () => {
    await expectSaga(handleRequest, personalSignRequest)
      .withState(state)
      .call([viemWallet, 'signMessage'], { message: { raw: 'Some message' } })
      .run()

    await expectSaga(handleRequest, { ...personalSignRequest, chainId: 'eip155:unsupported' })
      .withState(state)
      .call([viemWallet, 'signMessage'], { message: { raw: 'Some message' } })
      .run()
  })

  it('supports eth_signTypedData', async () => {
    await expectSaga(handleRequest, signTypedDataRequest)
      .withState(state)
      .call([viemWallet, 'signTypedData'], mockTypedData)
      .run()
  })

  it('supports eth_signTypedData_v4', async () => {
    await expectSaga(handleRequest, signTypedDataV4Request)
      .withState(state)
      .call([viemWallet, 'signTypedData'], mockTypedData)
      .run()
  })

  it('supports eth_signTransaction for supported chain', async () => {
    await expectSaga(handleRequest, signTransactionRequest, serializableTransactionRequest)
      .provide([[call(getWallet), mockWallet]])
      .withState(state)
      .call(unlockAccount, '0xwallet')
      .call([viemWallet, 'signTransaction'], getPreparedTransaction(serializableTransactionRequest))
      .run()
  })

  it('throws for a eth_signTransaction request on unsupported chain', async () => {
    await expect(
      async () =>
        await expectSaga(
          handleRequest,
          { ...signTransactionRequest, chainId: 'eip155:unsupported' },
          serializableTransactionRequest
        )
          .provide([[call(getWallet), mockWallet]])
          .withState(state)
          .run()
    ).rejects.toThrow('unsupported network')
    expect(viemWallet.signTransaction).not.toHaveBeenCalled()
  })

  it('supports eth_sendTransaction for supported chain', async () => {
    await expectSaga(handleRequest, sendTransactionRequest, serializableSendTransactionRequest)
      .provide([[call(getWallet), mockWallet]])
      .withState(state)
      .call(unlockAccount, '0xwallet')
      .call(
        [viemWallet, 'sendTransaction'],
        getPreparedTransaction(serializableSendTransactionRequest)
      )
      .run()
  })

  it('throws for a eth_sendTransaction request on unsupported chain', async () => {
    await expect(
      async () =>
        await expectSaga(
          handleRequest,
          { ...sendTransactionRequest, chainId: 'eip155:unsupported' },
          serializableSendTransactionRequest
        )
          .provide([[call(getWallet), mockWallet]])
          .withState(state)
          .run()
    ).rejects.toThrow('unsupported network')
    expect(viemWallet.sendTransaction).not.toHaveBeenCalled()
  })
})
