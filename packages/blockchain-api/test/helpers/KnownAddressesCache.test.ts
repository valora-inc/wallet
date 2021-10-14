import { DataSnapshot } from '@firebase/database-types'
import knownAddressesCache from '../../src/helpers/KnownAddressesCache'

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  database: () => ({
    ref: jest.fn((path) => ({
      on: (key: string, onValue: (snapshot: DataSnapshot) => void) => {
        const mockAddress = 'Test'
        const mockData = {
          [mockAddress]: { name: 'Test Name', imageUrl: 'Test Image' },
        }

        // @ts-ignore: We only need to mock "val" method, not the whole interface
        onValue({ val: () => mockData })
        return {}
      },
    })),
  }),
}))

describe('KnownAddressCache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    knownAddressesCache.startListening()
  })

  it('Should return address info when received it from firebase', () => {
    const { name, imageUrl } = knownAddressesCache.getDisplayInfoFor('Test')
    expect(name).toEqual('Test Name')
    expect(imageUrl).toEqual('Test Image')
  })

  it('Should return undefined values when there is no info for given address', () => {
    const { name, imageUrl } = knownAddressesCache.getDisplayInfoFor('Unknown')
    expect(name).toBeUndefined()
    expect(imageUrl).toBeUndefined()
  })
})
