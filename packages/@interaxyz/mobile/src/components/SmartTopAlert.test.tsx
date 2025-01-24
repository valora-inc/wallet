import { render } from '@testing-library/react-native'
import * as React from 'react'
import { AlertTypes } from 'src/alert/actions'
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
          type: AlertTypes.MESSAGE,
        }}
      />
    )

    expect(toJSON()).toMatchSnapshot()
  })
})
