import { EscrowedPayment } from 'src/escrow/actions'
import { identifierToE164NumberSelector } from 'src/identity/selectors'
import { ContactRecipient } from 'src/recipients/recipient'
import { useSelector } from 'src/redux/hooks'

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
