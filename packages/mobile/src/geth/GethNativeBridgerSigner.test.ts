import { rlpEncodedTx } from '@celo/wallet-base'
import GethNativeModule from 'react-native-geth'
import { GethNativeBridgeSigner, JWT_HEADER } from 'src/geth/GethNativeBridgeSigner'
import { mocked } from 'ts-jest/utils'

const mockGeth = mocked(GethNativeModule)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GethNativeBridgeSigner', () => {
  describe('signTransaction', () => {
    it('should sign the transaction when passing valid tx params', async () => {
      // Some random raw signed tx taken from mainnet
      // Note: this doesn't match the actual tx we're passing for signing, it's just for testing
      const rawSignedTxBase64 = Buffer.from(
        'f8b1821583841dcd65008301475180808094d8763cba276a3738e6de85b4b3bf5fded6d6ca7380b844a9059cbb0000000000000000000000009e438f4e810ff667a49aa36268ec058de5fe027e0000000000000000000000000000000000000000000000375b254304a9cb4de2830149fba0ecf8a8cd4f40c5f2c0255270f38b8260ee2a745bd8321d7122aecf517d8ba9eba0277b9441f4af5ead1ac1f785728226bda33c1bf3cf1405e33de56a18ff5cdb90',
        'hex'
      ).toString('base64')
      mockGeth.signTransaction.mockResolvedValue(rawSignedTxBase64)
      const signer = new GethNativeBridgeSigner(mockGeth, '0xACCOUNT')

      const tx = {
        from: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
        to: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
        gas: '0x1',
        gasPrice: '0x1',
        nonce: 0,
        chainId: 42220,
      }

      const encodedTx = rlpEncodedTx(tx)
      const result = await signer.signTransaction(0, encodedTx)
      expect(result).toEqual({
        r: '0xecf8a8cd4f40c5f2c0255270f38b8260ee2a745bd8321d7122aecf517d8ba9eb',
        s: '0x277b9441f4af5ead1ac1f785728226bda33c1bf3cf1405e33de56a18ff5cdb90',
        v: '0x0149fb',
      })
    })

    it('should throw an error when trying to sign a tx with an invalid gas price', async () => {
      const signer = new GethNativeBridgeSigner(mockGeth, '0xACCOUNT')
      const tx = {
        from: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
        to: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
        gas: '0x1',
        nonce: 0,
        chainId: 42220,
      }

      for (const gasPrice of ['0x0', '0x', '0', '']) {
        const encodedTx = { transaction: { ...tx, gasPrice }, rlpEncode: '0xTEST' }
        await expect(signer.signTransaction(0, encodedTx)).rejects.toThrow(
          `Preventing sign tx with 'gasPrice' set to '${gasPrice}'`
        )
      }
    })
  })
  describe('JWT', () => {
    it('Uses correct header', () => {
      const headerData = JSON.parse(Buffer.from(JWT_HEADER, 'base64').toString('ascii'))
      expect(headerData).toMatchObject({
        alg: 'ES256',
        typ: 'JWT',
      })
    })
    it('getJWT works assuming the signature function works and header is correct', async () => {
      const signer = new GethNativeBridgeSigner(mockGeth, 'mock_account')
      mockGeth.signHash = jest.fn().mockResolvedValue('mock_signature')
      const jwt = await signer.getJWT('123', 123)
      expect(jwt.includes('.')).toBeTruthy()
      const jwtParts = jwt.split('.')
      expect(jwtParts.length).toEqual(3)
      const [header, payload, signature] = jwtParts
      expect(header).toEqual(JWT_HEADER) // test for correctness of the header is done above
      expect(signature).toEqual('mock_signature')
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('ascii'))
      expect(decodedPayload).toMatchObject({
        sub: 'mock_account',
        iss: 'mock_public_key',
        exp: 123,
      })
    })
  })
  describe('publicKey', () => {
    it('getPublicKey: able to extract public key from geth', async () => {
      /*
      Used this code to get fixture data signatureBase64:

      import * as ethUtil from 'ethereumjs-util'

      const arbitraryMessage = '000'  // this is what's used in signer.getPublicKey()
      const privateKey = 'c6e6c40360a8ad4b353d694442e7b26ccee42bd3afd694c920c741e1b3a6b717'
      const hash = ethUtil.hashPersonalMessage(Buffer.from(arbitraryMessage, 'hex'))
      const {v, r, s} = ethUtil.ecsign(hash, Buffer.from(privateKey, 'hex'))
      const signatureHex = ethUtil.toRpcSig(v, r, s)
      const signatureBase64 = Buffer.from(signatureHex, 'hex').toString('base64')
       */
      const signer = new GethNativeBridgeSigner(mockGeth, 'mock_account')
      const signatureBase64 =
        'gnja+Oay19W93yrGQM21Dco1yWBkd5Ohrnot2yRYD7cga6vERzLTgOUlGrCqyeEXxq9Ocfqmaph+ETJ90q2zjhs='
      mockGeth.signHash = jest.fn().mockResolvedValue(signatureBase64)
      const publicKey = await signer.getPublicKey()
      expect(publicKey).toEqual(
        '0295367c5f90c5f30b8d8a6871f772d63b76322fc6099ca13e03abb379bd29443a'
      )
    })
  })
})
