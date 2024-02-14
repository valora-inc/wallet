import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { NameResolution, ResolutionKind } from '@valora/resolve-kit'
import React, { useState } from 'react'
import { View } from 'react-native'
import { Provider } from 'react-redux'
import TextInput from 'src/components/TextInput'
import { RecipientType } from 'src/recipients/recipient'
import { resolveId } from 'src/recipients/resolve-id'
import {
  mergeRecipients,
  useMapResolutionsToRecipients,
  useResolvedRecipients,
  useSendRecipients,
  useUniqueSearchRecipient,
} from 'src/send/hooks'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockAddressToE164Number,
  mockE164NumberToAddress,
  mockInvitableRecipient2,
  mockInvitableRecipient3,
  mockPhoneRecipientCache,
  mockRecipient,
  mockRecipient2,
  mockRecipient3,
  mockRecipient4,
} from 'test/values'

jest.mock('src/recipients/resolve-id')

const getStore = (phoneNumberVerified: boolean = true) =>
  createMockStore({
    app: {
      phoneNumberVerified,
    },
    send: {
      recentRecipients: [mockRecipient, mockRecipient2],
    },
    recipients: {
      phoneRecipientCache: mockPhoneRecipientCache,
    },
    identity: {
      addressToE164Number: mockAddressToE164Number,
      e164NumberToAddress: mockE164NumberToAddress,
    },
  })

describe('useResolvedRecipients', () => {
  beforeEach(() => {
    jest.mocked(resolveId).mockImplementation(async (id) => {
      return {
        resolutions:
          id === '5555555555'
            ? [
                {
                  kind: ResolutionKind.Address,
                  address: mockAccount,
                },
              ]
            : [],
      }
    })
  })

  async function renderHook() {
    const result = jest.fn()

    function TestComponent() {
      const [searchQuery, setSearchQuery] = useState('')
      const recipients = useResolvedRecipients(searchQuery)
      if (recipients.length) {
        result(recipients)
      }
      return (
        <View testID={recipients.length ? 'complete' : 'loading'}>
          <TextInput testID="searchInput" onChangeText={setSearchQuery} value={searchQuery} />
        </View>
      )
    }

    return {
      ...render(
        <Provider store={getStore()}>
          <TestComponent />
        </Provider>
      ),
      result,
    }
  }

  it('resolves and maps recipient', async () => {
    const { result, getByTestId } = await renderHook()

    expect(getByTestId('loading')).toBeTruthy()

    fireEvent.changeText(getByTestId('searchInput'), '55555555')
    fireEvent.changeText(getByTestId('searchInput'), '555555555')
    fireEvent.changeText(getByTestId('searchInput'), '5555555555')

    await waitFor(() => {
      expect(getByTestId('complete')).toBeTruthy()
    })
    expect(resolveId).toHaveBeenCalledTimes(2)
    expect(resolveId).toHaveBeenCalledWith('')
    expect(resolveId).toHaveBeenCalledWith('5555555555')
    expect(result).toHaveBeenCalledWith([
      {
        address: mockAccount.toLowerCase(),
        name: 'John Doe',
        thumbnailPath: undefined,
        contactId: 'contactId',
        e164PhoneNumber: '+14155550000',
        displayNumber: '14155550000',
        recipientType: RecipientType.Address,
      },
    ])
  })
})

describe('useSendRecipients', () => {
  function renderHook(phoneVerified: boolean) {
    const result = jest.fn()

    function TestComponent() {
      const recipients = useSendRecipients()
      result(recipients)
      return null
    }
    render(
      <Provider store={getStore(phoneVerified)}>
        <TestComponent />
      </Provider>
    )

    return result
  }

  it('gets sorted contact and recent recipients', () => {
    const result = renderHook(true)
    expect(result.mock.calls[0][0]).toEqual({
      recentRecipients: [mockRecipient, mockRecipient2],
      contactRecipients: [mockInvitableRecipient3, mockInvitableRecipient2, mockRecipient],
    })
  })

  it('excludes contact recipients if phone number is not verified', () => {
    const result = renderHook(false)
    expect(result.mock.calls[0][0]).toEqual({
      recentRecipients: [mockRecipient, mockRecipient2],
      contactRecipients: [],
    })
  })
})

describe('mergeRecipients', () => {
  it('orders recipients correctly without duplicates', () => {
    const resolvedRecipients = [mockRecipient3]
    const recentRecipients = [mockRecipient2]
    const contactRecipients = [
      mockRecipient,
      {
        ...mockRecipient3,
        name: 'some other name',
      },
    ]
    const mergedRecipients = mergeRecipients({
      contactRecipients,
      recentRecipients,
      resolvedRecipients,
      uniqueSearchRecipient: mockRecipient4,
    })
    expect(mergedRecipients).toEqual([mockRecipient3, mockRecipient2, mockRecipient])
  })
  it('uses the unique recipient if none other available', () => {
    const mergedRecipients = mergeRecipients({
      contactRecipients: [],
      recentRecipients: [],
      resolvedRecipients: [],
      uniqueSearchRecipient: mockRecipient4,
    })
    expect(mergedRecipients).toEqual([mockRecipient4])
  })
  it('returns empty list when no recipients available', () => {
    const mergedRecipients = mergeRecipients({
      contactRecipients: [],
      recentRecipients: [],
      resolvedRecipients: [],
    })
    expect(mergedRecipients).toEqual([])
  })
  it('does not dedpulicate undefined address', () => {
    const mergedRecipients = mergeRecipients({
      contactRecipients: [
        {
          ...mockRecipient,
          address: undefined,
        },
      ],
      recentRecipients: [
        {
          ...mockRecipient2,
          e164PhoneNumber: 'fake phone number',
          address: undefined,
        },
      ],
      resolvedRecipients: [],
    })
    expect(mergedRecipients).toEqual([
      {
        ...mockRecipient2,
        e164PhoneNumber: 'fake phone number',
        address: undefined,
      },
      {
        ...mockRecipient,
        address: undefined,
      },
    ])
  })
  it('does not dedpulicate undefined phone number', () => {
    const mergedRecipients = mergeRecipients({
      contactRecipients: [
        {
          ...mockRecipient,
          e164PhoneNumber: undefined,
        },
      ],
      recentRecipients: [
        {
          ...mockRecipient2,
          e164PhoneNumber: undefined,
          address: 'some fake address',
        },
      ],
      resolvedRecipients: [],
    })
    expect(mergedRecipients).toEqual([
      {
        ...mockRecipient2,
        address: 'some fake address',
        e164PhoneNumber: undefined,
      },
      {
        ...mockRecipient,
        e164PhoneNumber: undefined,
      },
    ])
  })
})

describe('useUniqueSearchRecipient', () => {
  function renderHook(searchQuery: string) {
    const result = jest.fn()

    function TestComponent() {
      const recipient = useUniqueSearchRecipient(searchQuery)
      result(recipient)
      return null
    }

    render(
      <Provider store={getStore()}>
        <TestComponent />
      </Provider>
    )

    return result
  }

  it('returns unique phone number recipient', () => {
    const result = renderHook('7255555555')
    expect(result.mock.calls[0][0]).toEqual({
      displayNumber: '(725) 555-5555',
      e164PhoneNumber: '+17255555555',
      recipientType: RecipientType.PhoneNumber,
    })
  })
  it('returns unique address recipient', () => {
    const mockAddress = '0x000000000000000000000000000000000000ABCD'
    const result = renderHook(mockAddress)
    expect(result.mock.calls[0][0]).toEqual({
      address: mockAddress.toLowerCase(),
      recipientType: RecipientType.Address,
    })
  })
  it('returns no results', () => {
    const result = renderHook('neither address nor phone number')
    expect(result.mock.calls[0][0]).toBe(undefined)
  })
})

describe('useMapResolutionsToRecipients', () => {
  function renderHook(searchQuery: string, resolutions: NameResolution[]) {
    const result = jest.fn()

    function TestComponent() {
      const recipients = useMapResolutionsToRecipients(searchQuery, resolutions)
      result(recipients)
      return null
    }

    render(
      <Provider store={getStore()}>
        <TestComponent />
      </Provider>
    )

    return result
  }

  it('returns recipient for address-based resolution', () => {
    const mockResolutions = [
      {
        kind: ResolutionKind.Address,
        address: mockAccount,
      },
    ]
    const result = renderHook('some query', mockResolutions)
    expect(result.mock.calls[0][0][0]).toEqual({
      address: mockAccount.toLowerCase(),
      name: 'John Doe',
      thumbnailPath: undefined,
      contactId: 'contactId',
      e164PhoneNumber: '+14155550000',
      displayNumber: '14155550000',
      recipientType: RecipientType.Address,
    })
  })
  it('returns recipient for nom-based resolution', () => {
    const mockResolutions = [
      {
        kind: ResolutionKind.Nom,
        address: mockAccount,
        name: 'Nom Handle',
      },
    ]
    const result = renderHook('some query', mockResolutions)
    expect(result.mock.calls[0][0][0]).toEqual({
      address: mockAccount.toLowerCase(),
      name: 'nomSpaceRecipient, {"name":"Nom Handle"}',
      recipientType: RecipientType.Nomspace,
    })
  })
  it('returns recipient for nom-based resolution with missing name', () => {
    const mockResolutions = [
      {
        kind: ResolutionKind.Nom,
        address: mockAccount,
      },
    ]
    const result = renderHook('some query', mockResolutions)
    expect(result.mock.calls[0][0][0]).toEqual({
      address: mockAccount.toLowerCase(),
      name: 'nomSpaceRecipient, {"name":"some query"}',
      recipientType: RecipientType.Nomspace,
    })
  })
})
