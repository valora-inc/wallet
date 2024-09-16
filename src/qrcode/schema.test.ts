import { DEEP_LINK_URL_SCHEME } from 'src/config'
import { UriData, uriDataFromJson, uriDataFromUrl, urlFromUriData } from 'src/qrcode/schema'
import { zeroAddress } from 'viem'

const validAddressData = { address: zeroAddress }
const validUserData = {
  ...validAddressData,
  displayName: 'alice',
  e164PhoneNumber: '+14155552671',
}
const validLocalPaymentData = {
  ...validAddressData,
  currencyCode: 'PHP',
  amount: '521.46',
}
const validBeamAndGoPaymentData = {
  address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
  displayName: 'Super 8',
  currencyCode: 'PHP',
  amount: '500',
}

describe('qrcode/schema', () => {
  describe('#uriDataFromJson', () => {
    it('should parse valid address', () => {
      expect(uriDataFromJson(validAddressData)).toStrictEqual({
        address: '0x0000000000000000000000000000000000000000',
        amount: undefined,
        currencyCode: undefined,
        displayName: undefined,
        e164PhoneNumber: undefined,
        token: undefined,
      })
    })

    it('should parse valid user data', () => {
      expect(uriDataFromJson(validUserData)).toStrictEqual({
        address: '0x0000000000000000000000000000000000000000',
        amount: undefined,
        currencyCode: undefined,
        displayName: 'alice',
        e164PhoneNumber: '+14155552671',
        token: undefined,
      })
    })

    it('should parse valid local payment data', () => {
      expect(uriDataFromJson(validLocalPaymentData)).toStrictEqual({
        address: '0x0000000000000000000000000000000000000000',
        amount: '521.46',
        currencyCode: 'PHP',
        displayName: undefined,
        e164PhoneNumber: undefined,
        token: undefined,
      })
    })

    it('should parse valid BeamAndGo payment data', () => {
      expect(uriDataFromJson(validBeamAndGoPaymentData)).toStrictEqual({
        address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
        amount: '500',
        currencyCode: 'PHP',
        displayName: 'Super 8',
        e164PhoneNumber: undefined,
        token: undefined,
      })
    })

    it('should parse with error on invalid address', () => {
      expect(() => uriDataFromJson({ address: zeroAddress.slice(0, -1) })).toThrowError(
        'is not a valid address'
      )
    })
  })

  const data1: Partial<UriData> = {
    address: '0x8902dBbE62F149841F2b05a63dFE615bD8F69340',
    displayName: undefined,
    e164PhoneNumber: undefined,
  }
  const url1 = urlFromUriData(data1)

  const data2: Partial<UriData> = {
    ...data1,
    displayName: 'Steven Cowrie',
    e164PhoneNumber: '+254720670799',
  }
  const url2 = urlFromUriData(data2)

  describe('#urlFromUriData', () => {
    it('should strip undefined values', () => {
      expect(url1).toBe(`${DEEP_LINK_URL_SCHEME}://wallet/pay?address=${data1.address}`)
    })

    it('should include defined values', () => {
      const params = new URLSearchParams(Object(data2))
      expect(url2).toBe(encodeURI(`${DEEP_LINK_URL_SCHEME}://wallet/pay?${params.toString()}`))
    })
  })

  describe('#uriDataFromUrl', () => {
    it('should parse correctly', () => {
      expect(uriDataFromUrl(url1)).toStrictEqual({
        address: '0x8902dBbE62F149841F2b05a63dFE615bD8F69340',
        amount: undefined,
        currencyCode: undefined,
        displayName: undefined,
        e164PhoneNumber: undefined,
        token: undefined,
      })
      expect(uriDataFromUrl(url2)).toStrictEqual({
        address: '0x8902dBbE62F149841F2b05a63dFE615bD8F69340',
        amount: undefined,
        currencyCode: undefined,
        displayName: 'Steven Cowrie',
        e164PhoneNumber: '+254720670799',
        token: undefined,
      })
    })
  })
})
