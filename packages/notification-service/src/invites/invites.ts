import {
  getLastInviteBlockNotified,
  sendInviteNotification,
  setLastInviteBlockNotified,
} from '../firebase'
import { getContractKit } from '../util/utils'

const TAG = 'INVITES'

export async function handleInvites() {
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
  console.debug(TAG, `Got ${events.length} escrow withdrawal events`)
  let maxBlock = fromBlock
  for (const event of events) {
    maxBlock = Math.max(event.blockNumber, fromBlock)
    const inviter = event.returnValues.to.toLowerCase()
    console.debug(TAG, `Sending invite notification to ${inviter}`)
    sendInviteNotification(inviter)
  }

  setLastInviteBlockNotified(maxBlock)
}
