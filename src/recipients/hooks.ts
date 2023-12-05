import { e164NumberToAddressSelector, verifiedAddressesSelector } from 'src/identity/selectors'
import { getRecipientVerificationStatus, Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'

export function useRecipientVerificationStatus(recipient: Recipient) {
  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  const verifiedAddresses = useSelector(verifiedAddressesSelector)
  return getRecipientVerificationStatus(recipient, e164NumberToAddress, verifiedAddresses)
}
