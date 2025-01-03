import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Image } from 'react-native'
import { Provider } from 'react-redux'
import ContactCircle from 'src/components/ContactCircle'
import { RecipientType } from 'src/recipients/recipient'
import { createMockStore } from 'test/utils'

const mockAddress = '0x123456'
const mockName = 'Mock name'

const mockStore = createMockStore()

describe('ContactCircle', () => {
  describe('when given recipient with only address', () => {
    it('uses User svg', () => {
      const wrapper = render(
        <Provider store={mockStore}>
          <ContactCircle
            size={30}
            recipient={{
              address: mockAddress,
              recipientType: RecipientType.Address,
            }}
          />
        </Provider>
      )
      expect(wrapper).toMatchSnapshot()
    })
  })
  describe('when has a thumbnail and name', () => {
    it('renders image', () => {
      const mockThumbnnailPath = './test.jpg'
      const { UNSAFE_getByType } = render(
        <Provider store={mockStore}>
          <ContactCircle
            size={30}
            recipient={{
              name: mockName,
              address: mockAddress,
              thumbnailPath: mockThumbnnailPath,
              recipientType: RecipientType.Address,
            }}
          />
        </Provider>
      )
      expect(UNSAFE_getByType(Image).props.source).toEqual({ uri: './test.jpg' })
    })
  })
  describe('when has a name but no picture', () => {
    it('renders initial', () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ContactCircle
            size={30}
            recipient={{
              name: mockName,
              address: mockAddress,
              recipientType: RecipientType.Address,
            }}
          />
        </Provider>
      )
      expect(getByText(mockName[0])).toBeTruthy()
    })
  })
})
