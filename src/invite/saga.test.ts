import { CeloTxReceipt } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { Share } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import i18n from 'src/i18n'
import { initiateEscrowTransfer, sendInvite } from 'src/invite/saga'
import { transactionConfirmed } from 'src/transactions/actions'
import { getConnectedUnlockedAccount, waitWeb3LastBlock } from 'src/web3/saga'
import { createMockStore } from 'test/utils'
import { mockAccount, mockCusdAddress, mockE164Number } from 'test/values'

const mockReceipt: CeloTxReceipt = {
  status: true,
  transactionHash: '0x50194f663a5d590376366998b81a3ef38dbc506f88040e52e886389933384df1',
  transactionIndex: 0,
  blockHash: '0x3894884029bccc7e759a0e375731aca84623737c613c5c2e3990f959a0da4541',
  blockNumber: 4031079,
  from: '0xA76df5D1caE697479fA08Afa7b0D35E182e0137a',
  to: '0x471EcE3750Da237f93B8E339c536989b8978a438',
  cumulativeGasUsed: 31502,
  gasUsed: 31502,
  logs: [],
  logsBloom: '',
}

jest.mock('src/account/actions', () => ({
  ...(jest.requireActual('src/account/actions') as any),
  getPincode: async () => 'pin',
}))

jest.mock('src/transactions/send', () => ({
  sendTransaction: async () => mockReceipt,
}))

const DYNAMIC_DOWNLOAD_LINK = 'http://celo.org'

jest.mock('src/config', () => {
  return {
    ...(jest.requireActual('src/config') as any),
    APP_STORE_ID: '1482389446',
    DYNAMIC_DOWNLOAD_LINK,
  }
})

Share.share = jest.fn()

const state = createMockStore({
  web3: { account: mockAccount },
  account: { pincodeType: PincodeType.CustomPin },
}).getState()

describe(sendInvite, () => {
  const AMOUNT_TO_SEND = new BigNumber(10)

  beforeAll(() => {
    jest.useRealTimers()
  })

  const dateNowStub = jest.fn(() => 1588200517518)
  global.Date.now = dateNowStub

  it('sends an invite as expected', async () => {
    i18n.t = jest.fn((key) => key)

    await expectSaga(sendInvite, mockE164Number, AMOUNT_TO_SEND, AMOUNT_TO_SEND, mockCusdAddress)
      .provide([
        [call(waitWeb3LastBlock), true],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(initiateEscrowTransfer, mockE164Number, AMOUNT_TO_SEND, mockCusdAddress), undefined],
      ])
      .withState(state)
      .dispatch(transactionConfirmed('a uuid', mockReceipt))
      .run()

    expect(i18n.t).toHaveBeenCalledWith('inviteWithEscrowedPayment', {
      amount: AMOUNT_TO_SEND.toFixed(2).toString(),
      token: 'cUSD',
      link: DYNAMIC_DOWNLOAD_LINK,
    })
    expect(Share.share).toHaveBeenCalledWith({ message: 'inviteWithEscrowedPayment' })
  })
})
