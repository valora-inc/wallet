import { contactsToRecipients, sortRecipients } from 'src/recipients/recipient'
import { mockContactList, mockRecipient, mockRecipient2, mockRecipient3 } from 'test/values'

describe('contactsToRecipients', () => {
  it('returns a recipient per phone number', () => {
    const countryCode = '+1'
    const recipients = contactsToRecipients(mockContactList, countryCode)

    if (!recipients) {
      return expect(false).toBeTruthy()
    }

    expect(recipients).toMatchObject({
      '+14155550000': {
        name: 'Bob Bobson',
        displayNumber: '(415) 555-0000',
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
