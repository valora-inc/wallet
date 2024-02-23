import { getTorusPrivateKey } from './web3auth'
import Torus from '@toruslabs/torus.js'

jest.mock('@toruslabs/torus.js')
jest.mock('@toruslabs/fetch-node-details', () => {
  return () => {
    return {
      getNodeDetails: jest.fn().mockReturnValue({
        torusNodeEndpoints: 'foo',
        torusNodePub: 'bar',
        torusIndexes: 'baz',
      }),
    }
  }
})

// default JWT from https://jwt.io/
const MOCK_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

describe('getTorusPrivateKey', () => {
  let mockRetrieveShares: jest.Mock
  let mockGetPublicAddress: jest.Mock

  beforeEach(() => {
    jest.resetAllMocks()

    mockRetrieveShares = jest.fn().mockReturnValue({
      finalKeyData: {
        evmAddress: 'Some EVM address',
        privKey: 'some private key',
      },
    })
    mockGetPublicAddress = jest.fn().mockReturnValue({
      finalKeyData: {
        evmAddress: 'Some EVM address',
      },
    })
    jest.mocked(Torus).mockReturnValue({
      getPublicAddress: mockGetPublicAddress,
      retrieveShares: mockRetrieveShares,
    } as any)
  })

  it('should retrun private key successfully', async () => {
    const result = await getTorusPrivateKey({ verifier: 'verifier', jwt: MOCK_JWT })
    expect(result).toEqual('some private key')
  })

  it('should throw when keyshare address does not match torus address', async () => {
    mockRetrieveShares.mockReturnValue({
      finalKeyData: {
        evmAddress: 'Some different EVM address',
        privKey: 'some private key',
      },
    })
    await expect(getTorusPrivateKey({ verifier: 'verifier', jwt: MOCK_JWT })).rejects.toThrow(
      'sharesEthAddressLower does not match torusPubKey'
    )
  })

  it('should throw when private key missing from share data', async () => {
    mockRetrieveShares.mockReturnValue({
      finalKeyData: {
        evmAddress: 'Some EVM address',
      },
    })
    await expect(getTorusPrivateKey({ verifier: 'verifier', jwt: MOCK_JWT })).rejects.toThrow(
      'private key missing from share data'
    )
  })
})
