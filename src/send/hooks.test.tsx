import React from 'react'
import { View } from 'react-native'
import { render, waitForElementToBeRemoved } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { createMockStore } from 'test/utils'
import {
  mockPhoneRecipientCache,
  mockRecipient,
  mockRecipient2,
  mockRecipient3,
  mockRecipient4,
  mockAccount,
  mockAddressToE164Number,
  mockE164NumberToAddress,
  mockInvitableRecipient2,
  mockInvitableRecipient3,
} from 'test/values'
import {
  useUniqueSearchRecipient,
  useMapResolutionsToRecipients,
  mergeRecipients,
  useSendRecipients,
  useResolvedRecipients,
} from 'src/send/hooks'
import { NameResolution, ResolutionKind } from '@valora/resolve-kit'
import { RecipientType } from 'src/recipients/recipient'
import { resolveId } from 'src/recipients/RecipientPicker'

jest.mock('src/recipients/RecipientPicker')

const store = createMockStore({
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
    jest.mocked(resolveId).mockResolvedValue({
      resolutions: [
        {
          kind: ResolutionKind.Address,
          address: mockAccount,
        },
      ],
    })
  })

  async function renderHook(searchQuery: string) {
    const result = jest.fn()

    function TestComponent() {
      const recipients = useResolvedRecipients(searchQuery)
      result(recipients)
      if (recipients.length) {
        return <View testID="complete"></View>
      } else {
        return <View testID="loading"></View>
      }
    }

    const { getByTestId } = render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    )

    await waitForElementToBeRemoved(() => getByTestId('loading'))

    return result
  }

  it('resolves and maps recipient', async () => {
    const result = await renderHook('5555555555')
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
  function renderHook() {
    const result = jest.fn()

    function TestComponent() {
      const recipients = useSendRecipients()
      result(recipients)
      return null
    }

    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    )

    return result
  }

  it('gets sorted contact and recent recipients', () => {
    const result = renderHook()
    expect(result.mock.calls[0][0]).toEqual({
      recentRecipients: [mockRecipient, mockRecipient2],
      contactRecipients: [mockInvitableRecipient3, mockInvitableRecipient2, mockRecipient],
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
      <Provider store={store}>
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
      <Provider store={store}>
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
