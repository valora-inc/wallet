import { toTransactionObject } from '@celo/connect'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga-test-plan/matchers'
import { Actions as AlertActions, AlertTypes } from 'src/alert/actions'
import { claimRewardsSaga } from 'src/consumerIncentives/saga'
import {
  claimRewards,
  claimRewardsFailure,
  claimRewardsSuccess,
} from 'src/consumerIncentives/slice'
import { ONE_CUSD_REWARD_RESPONSE } from 'src/consumerIncentives/testValues'
import { navigateHome } from 'src/navigator/NavigationService'
import { tokensByAddressSelector } from 'src/tokens/selectors'
import { Actions as TransactionActions } from 'src/transactions/actions'
import { sendTransaction } from 'src/transactions/send'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { getContract } from 'src/web3/utils'
import { mockAccount, mockCeurAddress, mockCusdAddress } from 'test/values'

const mockBaseNonce = 10
const fundsSourceAddress = '0xfundsSource'

jest.mock('src/web3/utils')
jest.mock('@celo/connect')

const contractKit = {
  getWallet: jest.fn(),
  getAccounts: jest.fn(),
  web3: {
    eth: {
      getTransactionCount: jest.fn(() => mockBaseNonce),
    },
  },
}

const mockContract = {
  methods: {
    fundsSource: () => ({
      call: () => fundsSourceAddress,
    }),
    claim: jest.fn(),
  },
}

const mockTx = {
  txo: jest.fn(),
}

const mockTokens = {
  [mockCusdAddress]: {
    symbol: 'cUSD',
  },
  [mockCeurAddress]: {
    symbol: 'cEUR',
  },
}

jest.mock('src/transactions/send', () => ({
  sendTransaction: jest.fn(() => ({ transactionHash: '0x123' })),
}))

describe('claimRewardsSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(toTransactionObject as jest.Mock).mockImplementation(() => mockTx)
  })

  it('claiming no rewards succeeds', async () => {
    await expectSaga(claimRewardsSaga, claimRewards([]))
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(tokensByAddressSelector), {}],
        [matchers.call.fn(sendTransaction), {}],
      ])
      .put(claimRewardsSuccess())
      .put.like({ action: { type: AlertActions.SHOW, message: 'superchargeClaimSuccess' } })
      .run()
    expect(navigateHome).toHaveBeenCalled()
  })

  it('claiming one reward succeeds', async () => {
    ;(getContract as jest.Mock).mockImplementation(() => mockContract)
    await expectSaga(claimRewardsSaga, claimRewards(ONE_CUSD_REWARD_RESPONSE))
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(tokensByAddressSelector), mockTokens],
      ])
      .put.like({
        action: {
          type: TransactionActions.ADD_STANDBY_TRANSACTION,
          transaction: { tokenAddress: mockCusdAddress.toLowerCase() },
        },
      })
      .put(claimRewardsSuccess())
      .put.like({ action: { type: AlertActions.SHOW, message: 'superchargeClaimSuccess' } })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(sendTransaction).toHaveBeenCalledWith(
      expect.anything(),
      mockAccount,
      expect.anything(),
      undefined,
      undefined,
      undefined,
      mockBaseNonce
    )
  })

  it('claiming two rewards succeeds', async () => {
    ;(getContract as jest.Mock).mockImplementation(() => mockContract)
    await expectSaga(
      claimRewardsSaga,
      claimRewards([
        {
          contractAddress: '0xusdDistributorContract',
          tokenAddress: mockCusdAddress,
          amount: (1e18).toString(16),
          index: 0,
          proof: [],
          createdAt: 1645591363099,
        },
        {
          contractAddress: '0xeurDistributorContract',
          tokenAddress: mockCeurAddress,
          amount: (1e18).toString(16),
          index: 0,
          proof: [],
          createdAt: 1645591363100,
        },
      ])
    )
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(tokensByAddressSelector), mockTokens],
      ])
      .put.like({
        action: {
          type: TransactionActions.ADD_STANDBY_TRANSACTION,
          transaction: { tokenAddress: mockCusdAddress.toLowerCase() },
        },
      })
      .put.like({
        action: {
          type: TransactionActions.ADD_STANDBY_TRANSACTION,
          transaction: { tokenAddress: mockCeurAddress.toLowerCase() },
        },
      })
      .put(claimRewardsSuccess())
      .put.like({ action: { type: AlertActions.SHOW, message: 'superchargeClaimSuccess' } })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(sendTransaction).toHaveBeenCalledTimes(2)
    expect(sendTransaction).toHaveBeenCalledWith(
      expect.anything(),
      mockAccount,
      expect.anything(),
      undefined,
      undefined,
      undefined,
      mockBaseNonce
    )
    expect(sendTransaction).toHaveBeenCalledWith(
      expect.anything(),
      mockAccount,
      expect.anything(),
      undefined,
      undefined,
      undefined,
      mockBaseNonce + 1
    )
  })

  it('fails if claiming a reward fails', async () => {
    ;(getContract as jest.Mock).mockImplementation(() => mockContract)
    ;(sendTransaction as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Error claiming')
    })
    await expectSaga(claimRewardsSaga, claimRewards(ONE_CUSD_REWARD_RESPONSE))
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(tokensByAddressSelector), mockTokens],
      ])
      .not.put(claimRewardsSuccess())
      .put(claimRewardsFailure())
      .put.like({
        action: {
          type: AlertActions.SHOW,
          alertType: AlertTypes.ERROR,
          message: 'superchargeClaimFailure',
        },
      })
      .run()
    expect(navigateHome).not.toHaveBeenCalled()
  })
})
