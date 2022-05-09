import { MinimalContact } from 'react-native-contacts'
import { contactsToRecipients, sortRecipients } from 'src/recipients/recipient'
import { mockRecipient, mockRecipient2, mockRecipient3 } from 'test/values'

describe('contactsToRecipients', () => {
  it('returns a recipient per phone number', () => {
    const countryCode = '+1'
    const mockContacts: MinimalContact[] = [
      {
        recordID: '1',
        displayName: 'Alice The Person',
        thumbnailPath: 'does-not-matter',
        phoneNumbers: [
          {
            label: 'mobile',
            number: '(209) 555-9790',
          },
        ],
      },
      {
        recordID: '2',
        thumbnailPath: 'does-not-matter',
        displayName: 'Bob Bobson',
        phoneNumbers: [
          { label: 'home', number: '+14155550000' },
          { label: 'mobile', number: '100200' },
        ],
      },
    ]

    const recipients = contactsToRecipients(mockContacts, countryCode)

    expect(recipients).toMatchObject({
      '+14155550000': {
        name: 'Bob Bobson',
        displayNumber: '+14155550000',
        e164PhoneNumber: '+14155550000',
        contactId: '2',
      },
      '+12095559790': {
        name: 'Alice The Person',
        displayNumber: '(209) 555-9790',
        e164PhoneNumber: '+12095559790',
        contactId: '1',
      },
    })
  })
})

describe('Recipient sorting', () => {
  const recipients = [mockRecipient2, mockRecipient, mockRecipient3]
  it('Sorts recipients without any prioritized', () => {
    expect(sortRecipients(recipients)).toStrictEqual([
      mockRecipient3,
      mockRecipient2,
      mockRecipient,
    ])
  })
  it('Sorts recipients with some prioritized', () => {
    const prioritized = { [mockRecipient.e164PhoneNumber!]: { contactId: 'contactId' } }
    expect(sortRecipients(recipients, prioritized)).toStrictEqual([
      mockRecipient,
      mockRecipient3,
      mockRecipient2,
    ])
  })
})
