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
    })

    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => MOCKED_DATE)
  })

  afterAll(() => {
    // Unlock Time
    dateNowSpy.mockRestore()
  })

  it('refreshes all prices correctly', async () => {
    await firebasePriceUpdater.refreshAllPrices()

    expect(updateFirebaseMock).toHaveBeenCalledTimes(2)
    expect(updateFirebaseMock).toHaveBeenCalledWith(`${FIREBASE_NODE}/key1`, {
      usdPrice: '1.5',
      priceFetchedAt: MOCKED_DATE,
    })
    expect(updateFirebaseMock).toHaveBeenCalledWith(`${FIREBASE_NODE}/key2`, {
      usdPrice: '1.7',
      priceFetchedAt: MOCKED_DATE,
    })
  })
})
