import { Ok } from '@celo/base'
import { FetchError } from '@celo/identity/lib/offchain-data-wrapper'
import FormData from 'form-data/lib/form_data'
import UploadServiceDataWrapper from 'src/account/UploadServiceDataWrapper'
import { getContractKitAsync } from 'src/web3/contracts'
import { mockAccount, mockAccount2, mockDEKAddress } from 'test/values'

// standardize the boundary value in FormData objects
global.Math.random = () => 0

jest.mock('@celo/identity/lib/offchain/utils', () => {
  return {
    ...(jest.requireActual('@celo/identity/lib/offchain/utils') as any),
    signBuffer: jest.fn(),
  }
})

jest.mock('@celo/utils/lib/address', () => {
  return {
    ...(jest.requireActual('@celo/utils/lib/address') as any),
    publicKeyToAddress: jest.fn(() => '0xb61bff5b1529ffae8315c9bc12a42b23cd15a5b7'),
  }
})

const mockAccountsWrapper = {
  getDataEncryptionKey: jest.fn(() => '0xb61bff5b1529ffae8315c9bc12a42b23cd15a5b7'),
}

describe(UploadServiceDataWrapper, () => {
  it('writes data successfully', async () => {
    const url1 = 'url1'
    const dataBuffer = Buffer.from('buffer')
    const sendFormData = (UploadServiceDataWrapper.prototype.sendFormData = jest.fn())
    const authorizeURLs = (UploadServiceDataWrapper.prototype.authorizeURLs = jest.fn())
    authorizeURLs.mockImplementation(() => {
      return [{ url: url1, fields: { test1: 'value1', test2: 'value2' } }]
    })
    const contractKit = await getContractKitAsync()
    const account = mockAccount
    const offchainWrapper = new UploadServiceDataWrapper(contractKit, account, mockDEKAddress)

    await offchainWrapper.writeDataTo(dataBuffer, Buffer.from('sig'), 'data')

    expect(sendFormData).toBeCalledTimes(1)
    const formDataExpected = new FormData()
    formDataExpected.append('test1', 'value1')
    formDataExpected.append('test2', 'value2')
    formDataExpected.append('file', dataBuffer)
    const formDataReceived = sendFormData.mock.calls[0][1]
    expect(Buffer.compare(formDataReceived.getBuffer(), formDataExpected.getBuffer())).toEqual(0)
    expect(sendFormData.mock.calls[0][0]).toEqual(url1)
  })

  it('returns error when fail to authorize URLs', async () => {
    const error = new Error('error')
    const dataBuffer = Buffer.from('buffer')
    const authorizeURLs = (UploadServiceDataWrapper.prototype.authorizeURLs = jest.fn())
    authorizeURLs.mockImplementation(() => {
      throw error
    })
    const contractKit = await getContractKitAsync()
    const account = mockAccount
    const offchainWrapper = new UploadServiceDataWrapper(contractKit, account, mockDEKAddress)

    expect(await offchainWrapper.writeDataTo(dataBuffer, Buffer.from('sig'), 'data')).toEqual(
      new FetchError(error)
    )
  })

  it('returns error when fail to send form data', async () => {
    const error = new Error('error')
    const url1 = 'url1'
    const dataBuffer = Buffer.from('buffer')
    const sendFormData = (UploadServiceDataWrapper.prototype.sendFormData = jest.fn())
    const authorizeURLs = (UploadServiceDataWrapper.prototype.authorizeURLs = jest.fn())
    sendFormData.mockImplementation(() => {
      throw error
    })
    authorizeURLs.mockImplementation(() => {
      return [{ url: url1, fields: { test1: 'value1', test2: 'value2' } }]
    })
    const contractKit = await getContractKitAsync()
    const account = mockAccount
    const offchainWrapper = new UploadServiceDataWrapper(contractKit, account, mockDEKAddress)
    offchainWrapper.kit.connection.chainId = jest.fn(() => Promise.resolve(0))
    await offchainWrapper.writeDataTo(dataBuffer, Buffer.from('sig'), 'data')

    expect(await offchainWrapper.writeDataTo(dataBuffer, Buffer.from('sig'), 'data')).toEqual(
      new FetchError(error)
    )
  })

  it('reads data successfully', async () => {
    const contractKit = await getContractKitAsync()
    const account = mockAccount
    const offchainWrapper = new UploadServiceDataWrapper(contractKit, account, mockDEKAddress)

    const payload = Buffer.from([
      186,
      193,
      139,
      87,
      203,
      15,
      238,
      150,
      70,
      126,
      154,
      163,
      5,
      244,
      82,
      237,
      168,
      91,
      142,
      54,
      142,
      111,
      172,
      143,
      20,
      248,
      254,
      218,
      50,
      16,
      65,
    ])
    const signature = Buffer.from([
      99,
      47,
      234,
      123,
      124,
      160,
      175,
      75,
      197,
      142,
      82,
      224,
      128,
      170,
      199,
      240,
      8,
      253,
      119,
      153,
      182,
      208,
      36,
      10,
      23,
      154,
      78,
      117,
      165,
      47,
      92,
      240,
      59,
      136,
      91,
      241,
      174,
      110,
      169,
      121,
      133,
      135,
      201,
      93,
      226,
      26,
      124,
      48,
      119,
      253,
      22,
      105,
      124,
      225,
      207,
      155,
      89,
      35,
      12,
      69,
      158,
      205,
      248,
      156,
      0,
    ])

    const responseBuffer = (UploadServiceDataWrapper.prototype.responseBuffer = jest.fn())
    responseBuffer.mockImplementationOnce(() => {
      return payload
    })
    responseBuffer.mockImplementationOnce(() => {
      return signature
    })

    offchainWrapper.kit.connection.chainId = jest.fn(() => Promise.resolve(44787))
    // @ts-ignore not mocking the entire AccountsWrapper because there are too many functions
    offchainWrapper.kit.contracts.getAccounts = jest.fn(() => Promise.resolve(mockAccountsWrapper))
    const expected = Buffer.from([
      186,
      193,
      139,
      87,
      203,
      15,
      238,
      150,
      70,
      126,
      154,
      163,
      5,
      244,
      82,
      237,
      168,
      91,
      142,
      54,
      142,
      111,
      172,
      143,
      20,
      248,
      254,
      218,
      50,
      16,
      65,
    ])
    expect(
      await offchainWrapper.readDataFromAsResult(mockAccount2, '/account/name.enc', true)
    ).toEqual(Ok(expected))
  })
})
