import { FetchMock } from 'jest-fetch-mock/types'
import {
  SupportRequestUserProperties,
  _generateCustomFields,
  sendSupportRequest,
} from 'src/account/zendesk'
import { APP_NAME, ZENDESK_API_KEY, ZENDESK_PROJECT_NAME } from 'src/config'

const mockFetch = fetch as FetchMock

async function areBlobsEqual(blob1: Blob, blob2: Blob) {
  return !Buffer.from(await blob1.arrayBuffer()).compare(Buffer.from(await blob2.arrayBuffer()))
}

expect.extend({
  async toEqualBlob(received, expected) {
    return {
      message: () =>
        this.utils.printDiffOrStringify(expected, received, 'Expected', 'Received', true),
      pass: await areBlobsEqual(received, expected),
    }
  },
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toEqualBlob(blob: Blob): R
    }
  }
}

describe('Zendesk', () => {
  beforeEach(() => {
    mockFetch.resetMocks()
  })
  it('uploads files and creates a ticket', async () => {
    const args = {
      message: 'message for support',
      userProperties: {
        appName: APP_NAME,
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
        systemVersion: '10',
      } satisfies SupportRequestUserProperties,
      logFiles: [
        { path: 'path1', type: 'type1', name: 'name1' },
        { path: 'path2', type: 'type2', name: 'name2' },
      ],
      userEmail: 'foo@what.com',
      userName: 'foo',
      subject: 'subject of ticket',
    }
    mockFetch.mockResponse(async (req) => {
      switch (req.url) {
        case 'file://path1/':
          return 'path1 contents'
        case 'file://path2/':
          return 'path2 contents'
        case `https://${ZENDESK_PROJECT_NAME}.zendesk.com/api/v2/uploads.json?filename=name1&binary=false`:
          return { status: 201, body: JSON.stringify({ upload: { token: 'uploadToken' } }) }
        case `https://${ZENDESK_PROJECT_NAME}.zendesk.com/api/v2/uploads.json?filename=name2&binary=false`:
          return { status: 201, body: JSON.stringify({ upload: { token: 'uploadToken2' } }) }
        case `https://${ZENDESK_PROJECT_NAME}.zendesk.com/api/v2/requests`:
          return JSON.stringify({ request: { id: 1234 } })
        default:
          throw new Error(`unexpected url: ${req.url}`)
      }
    })

    await sendSupportRequest(args)
    expect(mockFetch.mock.calls.length).toEqual(5)
    expect(mockFetch).toHaveBeenCalledWith(
      `https://${ZENDESK_PROJECT_NAME}.zendesk.com/api/v2/uploads.json?filename=name1&binary=false`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          Authorization: `Basic ${Buffer.from(
            `${args.userEmail}/token:${ZENDESK_API_KEY}`
          ).toString('base64')}`,
        },
        body: expect.anything(),
      }
    )

    const callName1 = mockFetch.mock.calls.find(
      (call) =>
        call[0] ===
        `https://${ZENDESK_PROJECT_NAME}.zendesk.com/api/v2/uploads.json?filename=name1&binary=false`
    )
    expect(callName1?.[1]?.body).toEqualBlob(new Blob(['path1 contents']))

    expect(mockFetch).toHaveBeenCalledWith(
      `https://${ZENDESK_PROJECT_NAME}.zendesk.com/api/v2/uploads.json?filename=name2&binary=false`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          Authorization: `Basic ${Buffer.from(
            `${args.userEmail}/token:${ZENDESK_API_KEY}`
          ).toString('base64')}`,
        },
        body: expect.anything(),
      }
    )

    const callName2 = mockFetch.mock.calls.find(
      (call) =>
        call[0] ===
        `https://${ZENDESK_PROJECT_NAME}.zendesk.com/api/v2/uploads.json?filename=name2&binary=false`
    )
    expect(callName2?.[1]?.body).toEqualBlob(new Blob(['path2 contents']))

    expect(mockFetch).toHaveBeenCalledWith(
      `https://${ZENDESK_PROJECT_NAME}.zendesk.com/api/v2/requests`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${args.userEmail}/token:${ZENDESK_API_KEY}`
          ).toString('base64')}`,
        },
        body: JSON.stringify({
          request: {
            subject: args.subject,
            custom_fields: _generateCustomFields(args.userProperties),
            comment: {
              body: `${args.message}
    
    ${JSON.stringify(args.userProperties, null, 2)}
    `,
              uploads: ['uploadToken', 'uploadToken2'],
            },
            requester: {
              email: args.userEmail,
              name: args.userName,
            },
          },
        }),
      }
    )
  })
})
