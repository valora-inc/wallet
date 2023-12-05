import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { fetchAddressesAndValidate, fetchAddressVerification } from 'src/identity/actions'
import {
  e164NumberToAddressSelector,
  verifiedAddressesSelector,
  verifiedAddressesLoadingSelector,
} from 'src/identity/selectors'
import { RecipientVerificationStatus } from 'src/identity/types'
import { getRecipientVerificationStatus, Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'

const useFetchRecipientVerificationStatus = () => {
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [recipientVerificationStatus, setRecipientVerificationStatus] = useState(
    RecipientVerificationStatus.UNKNOWN
  )

  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  const verifiedAddresses = useSelector(verifiedAddressesSelector)
  const verifiedAddressesLoading = useSelector(verifiedAddressesLoadingSelector)
  const dispatch = useDispatch()

  const unsetSelectedRecipient = () => {
    setRecipient(null)
    setRecipientVerificationStatus(RecipientVerificationStatus.UNKNOWN)
  }

  const setSelectedRecipient = (selectedRecipient: Recipient) => {
    setRecipient(selectedRecipient)
    setRecipientVerificationStatus(RecipientVerificationStatus.UNKNOWN)

    if (selectedRecipient?.e164PhoneNumber) {
      dispatch(fetchAddressesAndValidate(selectedRecipient.e164PhoneNumber))
    } else if (selectedRecipient?.address) {
      if (verifiedAddresses.includes(selectedRecipient.address)) {
        setRecipientVerificationStatus(RecipientVerificationStatus.VERIFIED)
      } else {
        dispatch(fetchAddressVerification(selectedRecipient.address))
      }
    }
  }

  useEffect(() => {
    if (
      recipient &&
      recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN &&
      !verifiedAddressesLoading
    ) {
      // e164NumberToAddress is updated after a successful phone number lookup,
      // verifiedAddresses is updated after a successful address lookup
      setRecipientVerificationStatus(
        getRecipientVerificationStatus(recipient, e164NumberToAddress, verifiedAddresses)
      )
    }
  }, [
    e164NumberToAddress,
    verifiedAddresses,
    verifiedAddressesLoading,
    recipient,
    recipientVerificationStatus,
  ])

  return {
    recipient,
    setSelectedRecipient,
    unsetSelectedRecipient,
    recipientVerificationStatus,
  }
}

export default useFetchRecipientVerificationStatus
