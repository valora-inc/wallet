import { render } from '@testing-library/react-native'
import * as React from 'react'
import ErrorBoundary from 'src/app/ErrorBoundary'

const ErrorComponent = () => {
  throw new Error('Snap!')
}

describe('ErrorBoundary', () => {
  it('catches the errors', () => {
    const wrapper = render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    )

    expect(wrapper.getAllByText('oops')).toHaveLength(1)
  })
})
