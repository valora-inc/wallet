import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga-test-plan/matchers'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { Actions as AlertActions, AlertTypes, showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import {
  SUPERCHARGE_FETCH_TIMEOUT,
  claimRewardsSaga,
  fetchAvailableRewardsSaga,
} from 'src/consumerIncentives/saga'
import { superchargeRewardContractAddressSelector } from 'src/consumerIncentives/selectors'
import {
  claimRewards,
  claimRewardsFailure,
  claimRewardsSuccess,
  fetchAvailableRewards,
  fetchAvailableRewardsFailure,
  fetchAvailableRewardsSuccess,
  setAvailableRewards,
} from 'src/consumerIncentives/slice'
import {
  ONE_CEUR_REWARD_RESPONSE_V2,
  ONE_CUSD_REWARD_RESPONSE_V2,
} from 'src/consumerIncentives/testValues'
import { SuperchargePendingRewardV2 } from 'src/consumerIncentives/types'
import { navigateHome } from 'src/navigator/NavigationService'
import { tokensByAddressSelector } from 'src/tokens/selectors'
import { Actions as TransactionActions } from 'src/transactions/actions'
import { sendTransaction } from 'src/transactions/send'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { getContractKit } from 'src/web3/contracts'
import config from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount, mockCeurAddress, mockCusdAddress } from 'test/values'

const mockBaseNonce = 10

jest.mock('src/web3/utils', () => ({
  ...(jest.requireActual('src/web3/utils') as any),
  getContract: jest.fn().mockImplementation(() => ({
    methods: {
      fundsSource: () => ({
        call: () => '0xfundsSource',
      }),
      claim: jest.fn(),
    },
  })),
}))
jest.mock('@celo/connect')

const contractKit = {
  getWallet: jest.fn(),
  getAccounts: jest.fn(),
  web3: {
    eth: {
      getTransactionCount: jest.fn(() => mockBaseNonce),
    },
  },
  connection: {
    chainId: jest.fn(() => '42220'),
    nonce: jest.fn(),
    gasPrice: jest.fn(),
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
  const expectedRewardsV2: SuperchargePendingRewardV2[] = [
    {
      transaction: {
        from: '0xabc',
        chainId: 42220,
        to: '0xxyz',
        data: '0x0000000asdfhawejkh',
        gas: 123,
      },
      details: {
        amount: '0x2386f26fc10000',
        tokenAddress: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
      },
    },
  ]

  it('stores v2 rewards after fetching them', async () => {
    const mockResponse = {
      json: () => {
        return { availableRewards: expectedRewardsV2 }
      },
    }
    const uri = `${config.fetchAvailableSuperchargeRewardsV2}?address=${userAddress}`

    await expectSaga(fetchAvailableRewardsSaga, fetchAvailableRewards())
      .provide([
        [select(phoneNumberVerifiedSelector), true],
        [select(walletAddressSelector), userAddress],
        [call(fetchWithTimeout, uri, null, SUPERCHARGE_FETCH_TIMEOUT), mockResponse],
      ])
      .put(setAvailableRewards(expectedRewardsV2))
      .put(fetchAvailableRewardsSuccess())
      .run()
  })

  it('bypasses the cache to fetch rewards for a user who has already claimed', async () => {
    const mockResponse = {
      json: () => {
        return { availableRewards: expectedRewardsV2 }
      },
    }
    const uri = `${config.fetchAvailableSuperchargeRewardsV2}?address=${userAddress}`

    await expectSaga(fetchAvailableRewardsSaga, fetchAvailableRewards({ forceRefresh: true }))
      .provide([
        [select(phoneNumberVerifiedSelector), true],
        [select(walletAddressSelector), userAddress],
        [
          call(
            fetchWithTimeout,
            uri,
            { headers: { 'Cache-Control': 'max-age=0' } },
            SUPERCHARGE_FETCH_TIMEOUT
          ),
          mockResponse,
        ],
      ])
      .put(setAvailableRewards(expectedRewardsV2))
      .put(fetchAvailableRewardsSuccess())
      .run()
  })

  it.each`
    version | availableRewardsUri
    ${'1'}  | ${config.fetchAvailableSuperchargeRewards}
    ${'2'}  | ${config.fetchAvailableSuperchargeRewardsV2}
  `('handles v$version failures correctly', async ({ version, availableRewardsUri }) => {
    const error = new Error('Unexpected error')
    const uri = `${availableRewardsUri}?address=${userAddress}`

    await expectSaga(fetchAvailableRewardsSaga, fetchAvailableRewards())
      .provide([
        [select(phoneNumberVerifiedSelector), true],
        [select(walletAddressSelector), userAddress],
        [call(fetchWithTimeout, uri, null, SUPERCHARGE_FETCH_TIMEOUT), error],
      ])
      .not.put(setAvailableRewards(expect.anything()))
      .not.put(fetchAvailableRewardsSuccess())
      .put(fetchAvailableRewardsFailure())
      .put(showError(ErrorMessages.SUPERCHARGE_FETCH_REWARDS_FAILED))
      .run()
  })

  it('skips fetching rewards for an unverified user for supercharge v2', async () => {
    await expectSaga(fetchAvailableRewardsSaga, fetchAvailableRewards())
      .provide([
        [select(phoneNumberVerifiedSelector), false],
        [select(walletAddressSelector), userAddress],
      ])
      .not.call(fetchWithTimeout)
      .run()
  })

  it('displays an error if a user is not properly verified for supercharge v2', async () => {
    await expectSaga(fetchAvailableRewardsSaga, fetchAvailableRewards())
      .provide([
        [select(phoneNumberVerifiedSelector), true],
        [select(walletAddressSelector), userAddress],
        [
          call(
            fetchWithTimeout,
            `${config.fetchAvailableSuperchargeRewardsV2}?address=${userAddress}`,
            null,
            SUPERCHARGE_FETCH_TIMEOUT
          ),
          JSON.stringify({ message: 'user not verified' }),
        ],
      ])
      .not.put(setAvailableRewards(expect.anything()))
      .not.put(fetchAvailableRewardsSuccess())
      .put(fetchAvailableRewardsFailure())
      .put(showError(ErrorMessages.SUPERCHARGE_FETCH_REWARDS_FAILED))
      .run()
  })
})

describe('claimRewardsSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('claiming no rewards succeeds', async () => {
    await expectSaga(claimRewardsSaga, claimRewards([]))
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
      ])
      .put(claimRewardsSuccess())
      .put.like({ action: { type: AlertActions.SHOW, message: 'superchargeClaimSuccess' } })
      .run()
    expect(navigateHome).toHaveBeenCalled()
  })

  describe('claiming rewards in version 2', () => {
    const defaultProviders: (EffectProviders | StaticProvider)[] = [
      [call(getContractKit), contractKit],
      [call(getConnectedUnlockedAccount), mockAccount],
      [select(tokensByAddressSelector), mockTokens],
      [select(superchargeRewardContractAddressSelector), '0xsuperchargeContract'],
    ]

    it('claims one reward successfully', async () => {
      await expectSaga(claimRewardsSaga, claimRewards([ONE_CUSD_REWARD_RESPONSE_V2]))
        .provide(defaultProviders)
        .put.like({
          action: {
            type: TransactionActions.ADD_STANDBY_TRANSACTION,
            transaction: {
              amount: {
                tokenAddress: mockCusdAddress.toLowerCase(),
              },
            },
          },
        })
        .put(fetchAvailableRewards({ forceRefresh: true }))
        .put(claimRewardsSuccess())
        .put.like({ action: { type: AlertActions.SHOW, message: 'superchargeClaimSuccess' } })
        .run()
      expect(navigateHome).toHaveBeenCalled()
      expect(sendTransaction).toHaveBeenCalledWith(
        expect.anything(),
        mockAccount,
        expect.anything(),
        ONE_CUSD_REWARD_RESPONSE_V2.transaction.gas,
        undefined,
        undefined,
        mockBaseNonce
      )
    })

    it('claims two rewards successfully', async () => {
      await expectSaga(
        claimRewardsSaga,
        claimRewards([ONE_CUSD_REWARD_RESPONSE_V2, ONE_CEUR_REWARD_RESPONSE_V2])
      )
        .provide(defaultProviders)
        .put.like({
          action: {
            type: TransactionActions.ADD_STANDBY_TRANSACTION,
            transaction: {
              amount: {
                tokenAddress: mockCusdAddress.toLowerCase(),
              },
            },
          },
        })
        .put.like({
          action: {
            type: TransactionActions.ADD_STANDBY_TRANSACTION,
            transaction: {
              amount: {
                tokenAddress: mockCeurAddress.toLowerCase(),
              },
            },
          },
        })
        .put(fetchAvailableRewards({ forceRefresh: true }))
        .put(claimRewardsSuccess())
        .put.like({ action: { type: AlertActions.SHOW, message: 'superchargeClaimSuccess' } })
        .run()
      expect(navigateHome).toHaveBeenCalled()
      expect(sendTransaction).toHaveBeenCalledTimes(2)
      expect(sendTransaction).toHaveBeenCalledWith(
        expect.anything(),
        mockAccount,
        expect.anything(),
        ONE_CUSD_REWARD_RESPONSE_V2.transaction.gas,
        undefined,
        undefined,
        mockBaseNonce
      )
      expect(sendTransaction).toHaveBeenCalledWith(
        expect.anything(),
        mockAccount,
        expect.anything(),
        ONE_CEUR_REWARD_RESPONSE_V2.transaction.gas,
        undefined,
        undefined,
        mockBaseNonce + 1
      )
    })

    it('fails if claiming reward fails', async () => {
      ;(sendTransaction as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Error claiming')
      })
      await expectSaga(claimRewardsSaga, claimRewards([ONE_CUSD_REWARD_RESPONSE_V2]))
        .provide(defaultProviders)
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

    it('fails if the reward transaction to address is incorrect', async () => {
      await expectSaga(claimRewardsSaga, claimRewards([ONE_CUSD_REWARD_RESPONSE_V2]))
        .provide([
          [select(superchargeRewardContractAddressSelector), '0xnewSuperchargeContract'],
          ...defaultProviders,
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
})
