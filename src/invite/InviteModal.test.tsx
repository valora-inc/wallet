import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import InviteModal from 'src/invite/InviteModal'

describe('InviteModal', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <InviteModal
        title="some title"
        description="some description"
        buttonLabel="some button label"
        disabled
        onClose={jest.fn()}
        onShareInvite={jest.fn()}
      />
    )

    expect(getByText('some title')).toBeTruthy()
    expect(getByText('some description')).toBeTruthy()
    expect(getByText('some button label')).toBeDisabled()
  })

  it('fires the correct callbacks', () => {
    const onCloseSpy = jest.fn()
    const onShareInviteSpy = jest.fn()

    const { getByText, getByTestId } = render(
      <InviteModal
        title="some title"
        description="some description"
        buttonLabel="some button label"
        disabled={false}
        onClose={onCloseSpy}
        onShareInvite={onShareInviteSpy}
      />
    )

    fireEvent.press(getByText('some button label'))
    fireEvent.press(getByTestId('InviteModalContainer/Back'))

    expect(onShareInviteSpy).toHaveBeenCalledTimes(1)
    expect(onCloseSpy).toHaveBeenCalledTimes(1)
  })
})
