import { ContractKit } from '@celo/contractkit'
import { handleInvites } from '../src/invites/invites'
import * as utils from '../src/util/utils'

export let sendInviteNotification: any
export let getLastInviteBlockNotified: any
export let setLastInviteBlockNotified: any
const lastNotifiedBlock = 150

jest.mock('../src/firebase', () => {
  sendInviteNotification = jest.fn()
  getLastInviteBlockNotified = jest.fn(() => lastNotifiedBlock)
  setLastInviteBlockNotified = jest.fn((newblock) => newblock)
  return {
    sendInviteNotification,
    getLastInviteBlockNotified,
    setLastInviteBlockNotified,
  }
})

jest.mock('../src/util/utils')

const mockIdentifier = '0x000'
const mockInviter1 = '0x0001'
const mockInviter2 = '0x0002'

interface EscrowEventMetadata {
  inviter: string
  blockNumber: number
  identifier: string
}

const mockPastEscrowEvents = (events: EscrowEventMetadata[]) => {
  jest.spyOn(utils, 'getContractKit').mockImplementation(async () => {
    return {
      contracts: {
        getEscrow: async () => {
          return {
            getPastEvents: async (event, options) => {
              return events.map((event) => ({
                blockNumber: event.blockNumber,
                returnValues: {
                  identifier: event.identifier,
                  to: event.inviter,
                },
              }))
            },
          }
        },
      },
    } as ContractKit
  })
}

describe('Invites', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should send notifications and update last block when evets are received', async () => {
    mockPastEscrowEvents([
      {
        blockNumber: lastNotifiedBlock + 5,
        identifier: mockIdentifier,
        inviter: mockInviter1,
      },
      {
        blockNumber: lastNotifiedBlock + 10,
        identifier: mockIdentifier,
        inviter: mockInviter2,
      },
    ])

    await handleInvites()

    expect(sendInviteNotification).toHaveBeenCalledTimes(2)
    expect(sendInviteNotification).toHaveBeenCalledWith(mockInviter1)
    expect(sendInviteNotification).toHaveBeenCalledWith(mockInviter2)

    expect(setLastInviteBlockNotified).toHaveBeenCalledWith(lastNotifiedBlock + 10)
  })

  it('should not send notifications nor update last block when there are no events', async () => {
    mockPastEscrowEvents([])

    await handleInvites()

    expect(sendInviteNotification).not.toHaveBeenCalled()
    expect(setLastInviteBlockNotified).not.toHaveBeenCalled()
  })
})
