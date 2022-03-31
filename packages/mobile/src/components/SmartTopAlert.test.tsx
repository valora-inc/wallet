import { render } from '@testing-library/react-native'
import * as React from 'react'
import SmartTopAlert from 'src/components/SmartTopAlert'

describe('SmartTopAlert', () => {
  it('renders correctly', async () => {
    const { toJSON } = render(
      <SmartTopAlert
        alert={{
          dismissAfter: 5,
          title: 'Smart Top Alert',
          message: 'dont get funny',
          onPress: jest.fn(),
          type: 'message',
        }}
      />
    )

    expect(toJSON()).toMatchSnapshot()
  })
})
