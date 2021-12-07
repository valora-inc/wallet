import BigNumber from 'bignumber.js'
import FirebasePriceUpdater from './FirebasePriceUpdater'

const updateFirebaseMock = jest.fn()
const fetchFromFirebaseMock = jest.fn()
jest.mock('../firebase', () => ({
  updateFirebase: (path: string, value: any) => updateFirebaseMock(path, value),
  fetchFromFirebase: (path: string) => fetchFromFirebaseMock(path),
}))

const calculatecUSDPricesMock = jest.fn()
const mockedManager = {
  calculatecUSDPrices: () => calculatecUSDPricesMock(),
}

const decimalCallMock = jest.fn()
const nameCallMock = jest.fn()
const symbolCallMock = jest.fn()
const contractMock = jest.fn((abi, address) => ({
  methods: {
    decimals: () => ({
      call: () => decimalCallMock(),
    }),
    name: () => ({
      call: () => nameCallMock(),
    }),
    symbol: () => ({
      call: () => symbolCallMock(),
    }),
  },
}))

jest.mock('../contractKit', () => ({
  getContractKit: () => ({
    web3: {
      eth: {
        Contract: jest
          .fn()
          .mockImplementation((abi: any, address: string) => contractMock(abi, address)),
      },
    },
  }),
}))

jest.mock('axios', () => ({
  get: (path: string) => ({
    data: {
      tokens: [
        {
          address: 'not_Added_Address',
          logoURI: 'notAddedAddressUri',
        },
        {
          address: 'address1',
          logoURI: 'address1Uri',
        },
      ],
    },
  }),
}))

const FIREBASE_NODE = '/tokensInfo'

const MOCKED_DATE = 1487076708000

describe('FirebasePriceUpdater', () => {
  let firebasePriceUpdater: FirebasePriceUpdater
  let dateNowSpy: any

  beforeEach(() => {
    jest.clearAllMocks()
    // @ts-ignore
    firebasePriceUpdater = new FirebasePriceUpdater(mockedManager)
    fetchFromFirebaseMock.mockReturnValue({
      key1: {
        address: 'address1',
      },
      key2: {
        address: 'address2',
      },
    })

    calculatecUSDPricesMock.mockReturnValue({
      address1: new BigNumber(1.5),
      address2: new BigNumber(1.7),
      not_added_address: new BigNumber(2),
    })

    decimalCallMock.mockReturnValue(18)
    nameCallMock.mockReturnValue('fakeToken')
    symbolCallMock.mockReturnValue('FT')

    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => MOCKED_DATE)
  })

  afterAll(() => {
    // Unlock Time
    dateNowSpy.mockRestore()
  })

  it('refreshes all prices correctly', async () => {
    await firebasePriceUpdater.updateTokensInfo()

    expect(updateFirebaseMock).toHaveBeenCalledTimes(3)
    expect(updateFirebaseMock).toHaveBeenCalledWith(`${FIREBASE_NODE}/key1`, {
      usdPrice: '1.5',
      priceFetchedAt: MOCKED_DATE,
      imageUrl: 'address1Uri',
      address: 'address1',
    })
    expect(updateFirebaseMock).toHaveBeenCalledWith(`${FIREBASE_NODE}/key2`, {
      usdPrice: '1.7',
      priceFetchedAt: MOCKED_DATE,
      address: 'address2',
    })
    expect(updateFirebaseMock).toHaveBeenCalledWith(`${FIREBASE_NODE}/not_added_address`, {
      decimals: 18,
      name: 'fakeToken',
      symbol: 'FT',
      usdPrice: '2',
      priceFetchedAt: MOCKED_DATE,
      imageUrl: 'notAddedAddressUri',
      address: 'not_added_address',
    })
  })
})
