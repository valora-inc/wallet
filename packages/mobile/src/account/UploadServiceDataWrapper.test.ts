import { Ok } from '@celo/base'
import { FetchError } from '@celo/identity/lib/offchain-data-wrapper'
import FormData from 'form-data/lib/form_data'
import UploadServiceDataWrapper from 'src/account/UploadServiceDataWrapper'
import { getContractKitAsync } from 'src/web3/contracts'
import { mockAccount, mockAccount2 } from 'test/values'

// standardize the boundary value in FormData objects
global.Math.random = () => 0

describe(UploadServiceDataWrapper, () => {
  it('write data successfully', async () => {
    const url1 = 'url1'
    const dataBuffer = Buffer.from('buffer')
    const sendFormData = (UploadServiceDataWrapper.prototype.sendFormData = jest.fn())
    const authorizeURLs = (UploadServiceDataWrapper.prototype.authorizeURLs = jest.fn())
    authorizeURLs.mockImplementation(() => {
      return [{ url: url1, fields: { test1: 'value1', test2: 'value2' } }]
    })
    const contractKit = await getContractKitAsync()
    const account = mockAccount
    const offchainWrapper = new UploadServiceDataWrapper(contractKit, account)

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

  it('return error when fail to authorize URLs', async () => {
    const error = new Error('error')
    const dataBuffer = Buffer.from('buffer')
    const authorizeURLs = (UploadServiceDataWrapper.prototype.authorizeURLs = jest.fn())
    authorizeURLs.mockImplementation(() => {
      throw error
    })
    const contractKit = await getContractKitAsync()
    const account = mockAccount
    const offchainWrapper = new UploadServiceDataWrapper(contractKit, account)

    expect(await offchainWrapper.writeDataTo(dataBuffer, Buffer.from('sig'), 'data')).toEqual(
      new FetchError(error)
    )
  })

  it('return error when fail to send form data', async () => {
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
    const offchainWrapper = new UploadServiceDataWrapper(contractKit, account)

    await offchainWrapper.writeDataTo(dataBuffer, Buffer.from('sig'), 'data')

    expect(await offchainWrapper.writeDataTo(dataBuffer, Buffer.from('sig'), 'data')).toEqual(
      new FetchError(error)
    )
  })

  it.skip('reads data successfully', async () => {
    const contractKit = await getContractKitAsync()
    const account = mockAccount
    const offchainWrapper = new UploadServiceDataWrapper(contractKit, account)

    const readAddress = mockAccount2
    const responseBuffer = (UploadServiceDataWrapper.prototype.responseBuffer = jest.fn())
    responseBuffer.mockImplementation(() => {
      return new ArrayBuffer(0)
    })
    // const chainID = UploadServiceDataWrapper.prototype.kit = jest.fn()
    // chainID.mockImplementation(() => Promise.resolve(0))

    offchainWrapper.kit.connection.chainId = jest.fn(() => Promise.resolve(0))

    expect(await offchainWrapper.readDataFromAsResult(readAddress, 'data path', true)).toEqual(
      Ok(Buffer.from('Asdf'))
    )
  })
})
