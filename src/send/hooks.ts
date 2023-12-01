import { useState, useMemo, useEffect } from 'react'
import { debounce, throttle } from 'lodash'
import useSelector from 'src/redux/useSelector'
import { useAsync } from 'react-async-hook'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { isValidAddress } from '@celo/utils/lib/address'
import { parsePhoneNumber } from '@celo/phone-utils'
import {
  sortRecipients,
  getRecipientFromAddress,
  Recipient,
  RecipientType,
  filterRecipientFactory,
} from 'src/recipients/recipient'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { useTranslation } from 'react-i18next'
import { NameResolution, ResolutionKind } from '@valora/resolve-kit'
import { resolveId } from 'src/recipients/RecipientPicker'
import { importContactsProgressSelector } from 'src/identity/selectors'
import { ImportContactsStatus } from 'src/identity/types'

const TYPING_DEBOUNCE_MILLSECONDS = 300
const SEARCH_THROTTLE_TIME = 100

/**
 * Returns a single ordered list of all recipients to show in search results,
 * as well as the search query state variable itself and its setter.
 *
 * onSearch is a callback function which will be called with the search query
 * just before it's updated.
 *
 * This hook is tested via the SendSelectRecipient.test.tsx file.
 */
export function useMergedSearchRecipients(onSearch: (searchQuery: string) => void) {
  const [searchQuery, setSearchQuery] = useState('')

  const { contactRecipients, recentRecipients } = useSendRecipients()

  const [contactsFiltered, setContactsFiltered] = useState(() => contactRecipients)
  const [recentFiltered, setRecentFiltered] = useState(() => recentRecipients)

  const recentRecipientsFilter = useMemo(
    () => filterRecipientFactory(recentRecipients, false),
    [recentRecipients]
  )
  const contactRecipientsFilter = useMemo(
    () => filterRecipientFactory(contactRecipients, true),
    [contactRecipients]
  )

  const throttledSearch = throttle((searchInput: string) => {
    onSearch(searchInput)
    setSearchQuery(searchInput)
    setRecentFiltered(recentRecipientsFilter(searchInput))
    setContactsFiltered(contactRecipientsFilter(searchInput))
  }, SEARCH_THROTTLE_TIME)

  useEffect(() => {
    // Clear search when recipients change to avoid tricky states
    onSearch('')
    setSearchQuery('')
  }, [recentRecipients, contactRecipients])

  const resolvedRecipients = useResolvedRecipients(searchQuery)
  const uniqueSearchRecipient = useUniqueSearchRecipient(searchQuery)

  const mergedRecipients = useMemo(
    () =>
      mergeRecipients({
        contactRecipients: contactsFiltered,
        recentRecipients: recentFiltered,
        resolvedRecipients,
        uniqueSearchRecipient,
      }),
    [contactsFiltered, recentFiltered, resolvedRecipients, uniqueSearchRecipient]
  )

  return {
    mergedRecipients,
    searchQuery,
    setSearchQuery: throttledSearch,
  }
}

/**
 * Fetches recipients based off the search query by fetching from the resolveId
 * endpoint. The search query is debounced before making a network request in order
 * to prevent excessive network calls.
 */
export function useResolvedRecipients(searchQuery: string): Recipient[] {
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)
  const debounceSearchQuery = debounce((query: string) => {
    setDebouncedSearchQuery(query)
  }, TYPING_DEBOUNCE_MILLSECONDS)

  const defaultCountryCode = useSelector(defaultCountryCodeSelector)

  useEffect(() => {
    const parsedPhoneNumber = parsePhoneNumber(searchQuery, defaultCountryCode ?? undefined)

    if (parsedPhoneNumber) {
      debounceSearchQuery(parsedPhoneNumber.e164Number)
    } else {
      debounceSearchQuery(searchQuery)
    }
  }, [searchQuery, defaultCountryCode])
  const { result: resolveAddressResult } = useAsync(resolveId, [debouncedSearchQuery])
  const resolutions = resolveAddressResult?.resolutions ?? []
  return useMapResolutionsToRecipients(searchQuery, resolutions as NameResolution[])
}

/**
 * Returns recent and contact recipients from Redux.
 */
export function useSendRecipients() {
  const contactsCache = useSelector(phoneRecipientCacheSelector)
  const importContactsStatus = useSelector(importContactsProgressSelector)
  const contactRecipients = useMemo(() => {
    if (
      ![ImportContactsStatus.Stopped, ImportContactsStatus.Done].includes(
        importContactsStatus.status
      )
    ) {
      return []
    }
    return sortRecipients(Object.values(contactsCache))
  }, [contactsCache, importContactsStatus])
  const recentRecipients = useSelector((state) => state.send.recentRecipients)
  return {
    contactRecipients,
    recentRecipients,
  }
}

/**
 * Merges all recipient types, including contacts, recents, resolved, and unique, into a single
 * ordered list.
 *
 * Recipients are ordered by the following precedence:
 *  - Resolved recipients
 *  - Recent recipients
 *  - Contact recipients
 *  - Unique recipient, if present and no other recipients exist
 *
 * If there are any duplicated recipients (by phone number or address), they are dedpulicated,
 * picking the recipient to show based on the precedence listed above.
 */
export function mergeRecipients({
  contactRecipients,
  recentRecipients,
  resolvedRecipients,
  uniqueSearchRecipient,
}: {
  contactRecipients: Recipient[]
  recentRecipients: Recipient[]
  resolvedRecipients: Recipient[]
  uniqueSearchRecipient?: Recipient
}): Recipient[] {
  const allRecipients: Recipient[] = []
  allRecipients.push(...resolvedRecipients)
  allRecipients.push(...recentRecipients)
  allRecipients.push(...contactRecipients)

  const mergedRecipients: Recipient[] = []
  for (const potentialRecipient of allRecipients) {
    if (
      !mergedRecipients.find(
        (mergedRecipient) =>
          (mergedRecipient.e164PhoneNumber === potentialRecipient.e164PhoneNumber &&
            mergedRecipient.e164PhoneNumber) ||
          (mergedRecipient.address === potentialRecipient.address && mergedRecipient.address)
      )
    ) {
      mergedRecipients.push(potentialRecipient)
    }
  }

  if (!mergedRecipients.length && uniqueSearchRecipient) {
    mergedRecipients.push(uniqueSearchRecipient)
  }

  return mergedRecipients
}

/**
 * Determines a "unique" recipient to show, if no other recipients are available.
 * This unique recipient will only appear in search results if the search query
 * is exactly a phone number or address that does not otherwise appear in any
 * other recipient lookup.
 */
export function useUniqueSearchRecipient(searchQuery: string): Recipient | undefined {
  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const recipientInfo = useSelector(recipientInfoSelector)

  const parsedNumber = parsePhoneNumber(searchQuery, defaultCountryCode ?? undefined)
  if (parsedNumber) {
    return {
      displayNumber: parsedNumber.displayNumber,
      e164PhoneNumber: parsedNumber.e164Number,
      recipientType: RecipientType.PhoneNumber,
    }
  }
  if (isValidAddress(searchQuery)) {
    return getRecipientFromAddress(searchQuery.toLowerCase(), recipientInfo)
  }
}

/**
 * Maps resolution data from the resolveId endpoint to a list of recipients.
 */
export function useMapResolutionsToRecipients(
  searchQuery: string,
  resolutions: NameResolution[]
): Recipient[] {
  const recipientInfo = useSelector(recipientInfoSelector)
  const { t } = useTranslation()

  const resolvedRecipients = resolutions.map((resolution) => {
    const lowerCaseAddress = resolution.address.toLowerCase()
    switch (resolution.kind) {
      case ResolutionKind.Address:
        return getRecipientFromAddress(lowerCaseAddress, recipientInfo)
      case ResolutionKind.Nom:
        return {
          address: lowerCaseAddress,
          name: t('nomSpaceRecipient', { name: resolution.name ?? searchQuery }),
          recipientType: RecipientType.Nomspace,
        }
      default:
        return getRecipientFromAddress(lowerCaseAddress, recipientInfo)
    }
  })

  return resolvedRecipients.filter((recipient) => !!recipient)
}
