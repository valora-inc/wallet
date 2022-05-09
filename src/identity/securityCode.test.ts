import {
  ActionableAttestation,
  AttestationsWrapper,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { getAttestationCodeForSecurityCode } from 'src/identity/securityCode'
import Logger from 'src/utils/Logger'
import { mockAccount, mockE164Number, mockE164NumberHash, mockE164NumberPepper } from 'test/values'

const testSecurityCode = '51365977'
const phoneHashDetails: PhoneNumberHashDetails = {
  e164Number: mockE164Number,
  phoneHash: mockE164NumberHash,
  pepper: mockE164NumberPepper,
}
const mockActionableAttestations: ActionableAttestation[] = [
  {
    issuer: '5', // <- matches the first digit of testSecurityCode modulo 10
    blockNumber: 100,
    attestationServiceURL: 'https://fake.celo.org/0',
    name: '',
    version: '1.1.0',
  },
  {
    issuer: '15', // <- matches the first digit of testSecurityCode modulo 10
    blockNumber: 110,
    attestationServiceURL: 'https://fake.celo.org/1',
    name: '',
    version: '1.1.0',
  },
  {
    issuer: '25', // <- matches the first digit of testSecurityCode modulo 10
    blockNumber: 120,
    attestationServiceURL: 'https://fake.celo.org/2',
    name: '',
    version: '1.1.0',
  },
]

const spyLoggerWarn = jest.spyOn(Logger, 'warn')

describe(getAttestationCodeForSecurityCode, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the first successful code from getAttestationForSecurityCode', async () => {
    const mockAttestationsWrapper = {
      getAttestationForSecurityCode: jest
        .fn()
        .mockRejectedValueOnce(new Error('expected error 1'))
        .mockRejectedValueOnce(new Error('expected error 2'))
        .mockResolvedValueOnce('SUCCESS_ATTESTATION_CODE'),
    }

    await expect(
      getAttestationCodeForSecurityCode(
        (mockAttestationsWrapper as unknown) as AttestationsWrapper,
        phoneHashDetails,
        mockAccount,
        mockActionableAttestations,
        testSecurityCode,
        'TestSigner'
      )
    ).resolves.toBe('SUCCESS_ATTESTATION_CODE')

    expect(mockAttestationsWrapper.getAttestationForSecurityCode.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "https://fake.celo.org/0",
          Object {
            "account": "0x0000000000000000000000000000000000007E57",
            "issuer": "5",
            "phoneNumber": "+14155550000",
            "salt": "piWqRHHYWtfg9",
            "securityCode": "1365977",
          },
          "TestSigner",
        ],
        Array [
          "https://fake.celo.org/1",
          Object {
            "account": "0x0000000000000000000000000000000000007E57",
            "issuer": "15",
            "phoneNumber": "+14155550000",
            "salt": "piWqRHHYWtfg9",
            "securityCode": "1365977",
          },
          "TestSigner",
        ],
        Array [
          "https://fake.celo.org/2",
          Object {
            "account": "0x0000000000000000000000000000000000007E57",
            "issuer": "25",
            "phoneNumber": "+14155550000",
            "salt": "piWqRHHYWtfg9",
            "securityCode": "1365977",
          },
          "TestSigner",
        ],
      ]
    `)

    // check it logs an error for each individual call to getAttestationForSecurityCode that throws
    expect(spyLoggerWarn).toHaveBeenCalledTimes(2)
  })

  it('throws an error when all getAttestationForSecurityCode fail', async () => {
    const mockAttestationsWrapper = {
      getAttestationForSecurityCode: jest
        .fn()
        .mockRejectedValueOnce(new Error('expected error 1'))
        .mockRejectedValueOnce(new Error('expected error 2'))
        .mockRejectedValueOnce(new Error('expected error 3')),
    }

    await expect(
      getAttestationCodeForSecurityCode(
        (mockAttestationsWrapper as unknown) as AttestationsWrapper,
        phoneHashDetails,
        mockAccount,
        mockActionableAttestations,
        testSecurityCode,
        'TestSigner'
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
            "raceUntilSuccess all failed:
            Error: expected error 1
            Error: expected error 2
            Error: expected error 3"
          `)

    // check it logs an error for each individual call to getAttestationForSecurityCode that throws
    expect(spyLoggerWarn).toHaveBeenCalledTimes(3)
  })

  it('throws an error when no issuer matches the security code', async () => {
    const mockAttestationsWrapper = {
      getAttestationForSecurityCode: jest.fn().mockRejectedValue(new Error('Some test error')),
    }

    await expect(
      getAttestationCodeForSecurityCode(
        (mockAttestationsWrapper as unknown) as AttestationsWrapper,
        phoneHashDetails,
        mockAccount,
        mockActionableAttestations,
        '12345', // a different security code
        'TestSigner'
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Unable to find possible issuers for security code: 12345, attestation issuers: [5,15,25]"`
    )
  })
})
