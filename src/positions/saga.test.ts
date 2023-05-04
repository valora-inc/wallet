import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { fetchPositionsSaga } from 'src/positions/saga'
import {
  fetchPositionsFailure,
  fetchPositionsStart,
  fetchPositionsSuccess,
} from 'src/positions/slice'
import { Position } from 'src/positions/types'
import { getFeatureGate } from 'src/statsig'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('src/sentry/SentryTransactionHub')
jest.mock('src/statsig')

const MOCK_RESPONSE = {
  message: 'OK',
  data: [
    {
      type: 'app-token',
      network: 'celo',
      address: '0x19a75250c5a3ab22a8662e55a2b90ff9d3334b00',
      symbol: 'ULP',
      decimals: 18,
      label: 'Pool: MOO / CELO',
      tokens: [
        {
          type: 'base-token',
          network: 'celo',
          address: '0x17700282592d6917f6a73d0bf8accf4d578c131e',
          symbol: 'MOO',
          decimals: 18,
          priceUsd: '0.006945061569050171',
          balance: '180.868419020792201216',
        },
        {
          type: 'base-token',
          network: 'celo',
          address: '0x471ece3750da237f93b8e339c536989b8978a438',
          symbol: 'CELO',
          decimals: 18,
          priceUsd: '0.6959536890241361',
          balance: '1.801458498251141632',
        },
      ],
      pricePerShare: ['15.203387577266431', '0.15142650055521278'],
      priceUsd: '0.21097429445966362',
      balance: '11.896586737763895000',
      supply: '29726.018516587721136286',
    },
    {
      type: 'app-token',
      network: 'celo',
      address: '0x31f9dee850b4284b81b52b25a3194f2fc8ff18cf',
      symbol: 'ULP',
      decimals: 18,
      label: 'Pool: G$ / cUSD',
      tokens: [
        {
          type: 'base-token',
          network: 'celo',
          address: '0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a',
          symbol: 'G$',
          decimals: 18,
          priceUsd: '0.00016235559507324788',
          balance: '12400.197092864986',
        },
        {
          type: 'base-token',
          network: 'celo',
          address: '0x765de816845861e75a25fca122bb6898b8b1282a',
          symbol: 'cUSD',
          decimals: 18,
          priceUsd: '1',
          balance: '2.066998331535406848',
        },
      ],
      pricePerShare: ['77.49807502864574', '0.012918213362397938'],
      priceUsd: '0.025500459450704928',
      balance: '160.006517430032700000',
      supply: '232.413684885485035933',
    },
    {
      type: 'contract-position',
      address: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
      label: 'Farm: Pool: CELO / cUSD',
      tokens: [
        {
          type: 'app-token',
          network: 'celo',
          address: '0x1e593f1fe7b61c53874b54ec0c59fd0d5eb8621e',
          symbol: 'ULP',
          decimals: 18,
          label: 'Pool: CELO / cUSD',
          tokens: [
            {
              type: 'base-token',
              network: 'celo',
              address: '0x471ece3750da237f93b8e339c536989b8978a438',
              symbol: 'CELO',
              decimals: 18,
              priceUsd: '0.6959536890241361',
              balance: '0.950545800159603456',
            },
            {
              type: 'base-token',
              network: 'celo',
              address: '0x765de816845861e75a25fca122bb6898b8b1282a',
              symbol: 'cUSD',
              decimals: 18,
              priceUsd: '1',
              balance: '0.659223169268731392',
            },
          ],
          pricePerShare: ['2.827719585853931', '1.961082008754231'],
          priceUsd: '3.9290438860550765',
          balance: '0.336152780111169400',
          supply: '42744.727037884449180591',
        },
      ],
      balanceUsd: '1.3207590254762067',
    },
  ] as Position[],
}

const mockFetch = fetch as FetchMock

beforeEach(() => {
  jest.clearAllMocks()
  mockFetch.resetMocks()
})

describe(fetchPositionsSaga, () => {
  it('fetches positions successfully', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_RESPONSE))
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchPositionsSaga)
      .provide([[select(walletAddressSelector), mockAccount]])
      .put(fetchPositionsStart())
      .put(fetchPositionsSuccess(MOCK_RESPONSE.data))
      .run()
  })

  it("skips fetching positions if the feature gate isn't enabled", async () => {
    mocked(getFeatureGate).mockReturnValue(false)

    await expectSaga(fetchPositionsSaga)
      .provide([[select(walletAddressSelector), mockAccount]])
      .not.put(fetchPositionsStart())
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skips fetching positions if no address is available in the store', async () => {
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchPositionsSaga)
      .provide([[select(walletAddressSelector), null]])
      .not.put(fetchPositionsStart())
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("dispatches an error if there's an error", async () => {
    mockFetch.mockResponse(JSON.stringify({ message: 'something went wrong' }), { status: 500 })
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchPositionsSaga)
      .provide([[select(walletAddressSelector), mockAccount]])
      .put(fetchPositionsStart())
      .put.actionType(fetchPositionsFailure.type)
      .run()
  })
})
