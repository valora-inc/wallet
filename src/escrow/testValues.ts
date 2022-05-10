import BigNumber from 'bignumber.js'
import { EscrowedPayment } from 'src/escrow/actions'
import { multiplyByWei } from 'src/utils/formatting'
import { mockCusdAddress } from 'test/values'

const recipientPhone = '+491522345678'
const recipientIdentifier = '0xabc123'
const senderAddress = '0x000000000000000000000ce10'

const date = new BigNumber(
  new Date('Tue Mar 05 2019 13:44:06 GMT-0800 (Pacific Standard Time)').getTime() / 1000
)

export function escrowPaymentDouble(partial: object): EscrowedPayment {
  return {
    senderAddress,
    recipientPhone,
    recipientIdentifier,
    paymentID: 'FAKE_ID_1',
    tokenAddress: mockCusdAddress,
    amount: multiplyByWei(new BigNumber(7)).toString(),
    message: 'test message',
    timestamp: date,
    expirySeconds: new BigNumber(0),
    ...partial,
  }
}
