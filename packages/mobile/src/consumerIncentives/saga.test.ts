import { toTransactionObject } from '@celo/connect'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga-test-plan/matchers'
import { Actions as AlertActions, AlertTypes, showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { claimRewardsSaga, fetchAvailableRewardsSaga } from 'src/consumerIncentives/saga'
import {
  claimRewards,
  claimRewardsFailure,
  claimRewardsSuccess,
  fetchAvailableRewards,
  fetchAvailableRewardsFailure,
  fetchAvailableRewardsSuccess,
  setAvailableRewards,
} from 'src/consumerIncentives/slice'
import { ONE_CUSD_REWARD_RESPONSE } from 'src/consumerIncentives/testValues'
import { SuperchargePendingReward } from 'src/consumerIncentives/types'
import config from 'src/geth/networkConfig'
import { navigateHome } from 'src/navigator/NavigationService'
import { tokensByAddressSelector } from 'src/tokens/selectors'
import { Actions as TransactionActions } from 'src/transactions/actions'
import { sendTransaction } from 'src/transactions/send'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
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

describe('fetchAvailableRewardsSaga', () => {
  const userAddress = 'test'
  const expectedRewards: SuperchargePendingReward[] = [
    {
      amount: '0x2386f26fc10000',
      contractAddress: '0x7e87b603F816e6dE393c892565eEF051ce9Ce851',
      createdAt: 1650635674453,
      index: 0,
      tokenAddress: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
      proof: [],
    },
  ]
  const mockResponse = {
    json: () => {
      return { availableRewards: expectedRewards }
    },
  }
  const error = new Error('Unexpected error')

  const availableRewardsUri = `${config.cloudFunctionsUrl}/fetchAvailableSuperchargeRewards?address=${userAddress}`

  it('stores rewards after fetching them', async () => {
    await expectSaga(fetchAvailableRewardsSaga)
      .provide([
        [select(walletAddressSelector), userAddress],
        [call(fetchWithTimeout, availableRewardsUri), mockResponse],
      ])
      .put(setAvailableRewards(expectedRewards))
      .put(fetchAvailableRewardsSuccess())
      .run()
  })

  it('handles failures correctly', async () => {
    await expectSaga(fetchAvailableRewardsSaga)
      .provide([
        [select(walletAddressSelector), userAddress],
        [call(fetchWithTimeout, availableRewardsUri), error],
      ])
      .not.put(setAvailableRewards(expectedRewards))
      .not.put(fetchAvailableRewardsSuccess())
      .put(fetchAvailableRewardsFailure())
      .put(showError(ErrorMessages.SUPERCHARGE_FETCH_REWARDS_FAILED))
      .run()
  })
})

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
      .put(fetchAvailableRewards())
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
      .put(fetchAvailableRewards())
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
