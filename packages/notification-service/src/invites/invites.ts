import { EventLog } from 'web3-core'
import {
  getLastInviteBlockNotified,
  sendInviteNotification,
  setLastInviteBlockNotified,
} from '../firebase'
import { getContractKit } from '../util/utils'

const TAG = 'INVITES'

let sendingInvites = false

function updateLastInviteBlock(fromBlock: number, events: EventLog[]) {
  if (events.length === 0) {
    return
  }
  const maxBlock = events
    .map((event) => event.blockNumber)
    .reduce((max, current) => Math.max(max, current), fromBlock)
  setLastInviteBlockNotified(maxBlock)
}

export async function handleInvites() {
  try {
    if (sendingInvites) {
      return
    }
    sendingInvites = true

    const kit = await getContractKit()
    const fromBlock = getLastInviteBlockNotified() + 1
    if (fromBlock <= 0) {
      return
    }
    console.debug(TAG, `Starting to fetch invites from block ${fromBlock}`)

    const escrow = await kit.contracts.getEscrow()
    const events = await escrow.getPastEvents('Withdrawal', {
      fromBlock,
    })
    updateLastInviteBlock(fromBlock, events)
    console.debug(TAG, `Got ${events.length} escrow withdrawal events`)

    for (const event of events) {
      const inviter = event.returnValues.to.toLowerCase()
      console.debug(TAG, `Sending invite notification to ${inviter}`)
      await sendInviteNotification(inviter)
    }
  } catch (error) {
    console.error(TAG, 'Error while sending invite notifications', error)
  } finally {
    sendingInvites = false
  }
}
