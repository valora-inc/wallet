import { e164NumberToAddressSelector } from 'src/identity/selectors'
import { getRecipientVerificationStatus, Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'

export function useRecipientVerificationStatus(recipient: Recipient) {
  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  return getRecipientVerificationStatus(recipient, e164NumberToAddress)
}
