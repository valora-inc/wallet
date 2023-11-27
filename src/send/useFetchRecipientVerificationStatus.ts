import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import { e164NumberToAddressSelector } from 'src/identity/selectors'
import { RecipientVerificationStatus } from 'src/identity/types'
import { getRecipientVerificationStatus, Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'

const useFetchRecipientVerificationStatus = () => {
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [recipientVerificationStatus, setRecipientVerificationStatus] = useState(
    RecipientVerificationStatus.UNKNOWN
  )

  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  console.log(e164NumberToAddress)
  const dispatch = useDispatch()

  const unsetSelectedRecipient = () => {
    setRecipient(null)
    setRecipientVerificationStatus(RecipientVerificationStatus.UNKNOWN)
  }

  const setSelectedRecipient = (selectedRecipient: Recipient) => {
    setRecipient(selectedRecipient)
    setRecipientVerificationStatus(
      selectedRecipient?.address
        ? RecipientVerificationStatus.VERIFIED
        : RecipientVerificationStatus.UNKNOWN
    )

    if (selectedRecipient?.e164PhoneNumber) {
      dispatch(fetchAddressesAndValidate(selectedRecipient.e164PhoneNumber))
    }
  }

  useEffect(() => {
    if (recipient && recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN) {
      // e164NumberToAddress is updated after a successful phone number lookup
      setRecipientVerificationStatus(getRecipientVerificationStatus(recipient, e164NumberToAddress))
    }
  }, [e164NumberToAddress, recipient, recipientVerificationStatus])

  return {
    recipient,
    setSelectedRecipient,
    unsetSelectedRecipient,
    recipientVerificationStatus,
  }
}

export default useFetchRecipientVerificationStatus
