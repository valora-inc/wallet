import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import PictureInput from 'src/onboarding/registration/PictureInput'
import { createMockStore } from 'test/utils'

const mockProps = {
  picture: 'abc',
  onPhotoChosen: jest.fn(),
  backgroundColor: 'white',
}

jest.mock('react-native-image-crop-picke', () => ({
  openPicker: jest.fn(),
}))

describe('NameAndPictureScreen', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = render(
      <Provider store={store}>
        <PictureInput {...mockProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('', () => {})
})
