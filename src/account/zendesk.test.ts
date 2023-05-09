import { FetchMock } from 'jest-fetch-mock/types'
import { DeviceInfo, _generateCustomFields, sendSupportRequest } from 'src/account/zendesk'
import { ZENDESK_API_KEY } from 'src/config'

const mockFetch = fetch as FetchMock

jest.mock('src/utils/readFile', () => ({
  readFileChunked: jest.fn((filepath) => Promise.resolve(`${filepath} contents`)),
}))
describe('Zendesk', () => {
  beforeEach(() => {
    mockFetch.resetMocks()
  })
  it('uploads files and creates a ticket', async () => {
    const args = {
      message: 'message for support',
      deviceInfo: {
        version: '1.57.0',
        buildNumber: '123590',
        apiLevel: 29,
        os: 'android',
        country: 'US',
        region: 'CA',
        deviceId: '1234',
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy S10',
        address: '0x1234',
        sessionId: '1234',
        numberVerifiedCentralized: true,
        network: 'mainnet',
      } as DeviceInfo,
      logFiles: [
        { path: 'path1', type: 'type1', name: 'name1' },
        { path: 'path2', type: 'type2', name: 'name2' },
      ],
      userEmail: 'foo@what.com',
      userName: 'foo',
      subject: 'subject of ticket',
    }
    mockFetch.mockResponseOnce(JSON.stringify({ upload: { token: 'uploadToken' } }), {
      status: 201,
    })
    mockFetch.mockResponseOnce(JSON.stringify({ upload: { token: 'uploadToken2' } }), {
      status: 201,
    })

    await sendSupportRequest(args)
    expect(mockFetch.mock.calls.length).toEqual(3)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://valoraapp.zendesk.com/api/v2/uploads.json?filename=name1&binary=false',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          Authorization: `Basic ${Buffer.from(
            `${args.userEmail}/token:${ZENDESK_API_KEY}`
          ).toString('base64')}`,
        },
        body: 'path1 contents',
      }
    )

    expect(mockFetch).toHaveBeenCalledWith(
      'https://valoraapp.zendesk.com/api/v2/uploads.json?filename=name2&binary=false',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          Authorization: `Basic ${Buffer.from(
            `${args.userEmail}/token:${ZENDESK_API_KEY}`
          ).toString('base64')}`,
        },
        body: 'path2 contents',
      }
    )

    expect(mockFetch).toHaveBeenCalledWith('https://valoraapp.zendesk.com/api/v2/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${args.userEmail}/token:${ZENDESK_API_KEY}`).toString(
          'base64'
        )}`,
      },
      body: JSON.stringify({
        request: {
          subject: args.subject,
          custom_fields: _generateCustomFields(args.deviceInfo),
          comment: {
            body: `${args.message}
    
    ${JSON.stringify(args.deviceInfo)}
    `,
            uploads: ['uploadToken', 'uploadToken2'],
          },
          requester: {
            email: args.userEmail,
            name: args.userName,
          },
        },
      }),
    })
  })
})
