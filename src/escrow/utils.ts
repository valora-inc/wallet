import { ensureLeading0x } from '@celo/base'
import { generateDeterministicInviteCode } from '@celo/utils/lib/account'
import { publicKeyToAddress } from '@celo/utils/lib/address'
import { EscrowedPayment } from 'src/escrow/actions'
import { identifierToE164NumberSelector } from 'src/identity/selectors'
import { ContactRecipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'

export const generateEscrowPaymentIdAndPk = (
  recipientPhoneHash: string,
  recipientPepper: string,
  addressIndex: number = 0
) => {
  const { publicKey, privateKey } = generateDeterministicInviteCode(
    recipientPhoneHash,
    recipientPepper,
    addressIndex
  )
  return { paymentId: publicKeyToAddress(publicKey), privateKey: ensureLeading0x(privateKey) }
}

export const generateUniquePaymentId = (
  existingPaymentIds: string[],
  phoneHash: string,
  pepper: string
) => {
  const paymentIdSet: Set<string> = new Set(existingPaymentIds)

  // Using an upper bound of 100 to be sure this doesn't run forever given
  // the realistic amount of pending escrow txs is far less than this
  for (let i = 0; i < 100; i += 1) {
    const { paymentId } = generateEscrowPaymentIdAndPk(phoneHash, pepper, i)
    if (!paymentIdSet.has(paymentId)) {
      return paymentId
    }
  }
}

export const useEscrowPaymentRecipient = (payment: EscrowedPayment): ContactRecipient => {
  const { recipientPhone, recipientIdentifier } = payment

  const identifierToE164Number = useSelector(identifierToE164NumberSelector)
  const recipientCache = useSelector((state) => state.recipients.phoneRecipientCache)
  const phoneNumber = identifierToE164Number[recipientIdentifier] ?? recipientPhone
  const recipient = recipientCache[phoneNumber] ?? {
    name: phoneNumber,
    e164PhoneNumber: phoneNumber,
    contactId: '',
  }

  return recipient
}
