import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { noop } from 'lodash'
import React from 'react'
import { Share } from 'react-native'
import { Provider } from 'react-redux'
import { mocked } from 'ts-jest/utils'

import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { createMockStore } from 'test/utils'

import Invite from './Invite'
import { createDynamicLink } from './utils'

jest.mock('./utils', () => ({
  createDynamicLink: jest.fn(),
}))

const { press } = fireEvent
const mockedCreateDynamicLink = mocked(createDynamicLink)

describe('Invite', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => jest.clearAllMocks())

  const getWrapper = () =>
    render(
      <Provider
        store={createMockStore({
          web3: {
            account: '0xabc123',
          },
        })}
      >
        <Invite />
      </Provider>
    )

  it('should disable button while loading share URL', () => {
    mockedCreateDynamicLink.mockReturnValue(new Promise(noop))
    const { getByTestId } = getWrapper()
    expect(getByTestId('invite')).toBeDisabled()
  })

  it('should enable button when share URL is loaded', async () => {
    mockedCreateDynamicLink.mockResolvedValue('https://vlra.app/abc123')

    const { getByTestId } = getWrapper()

    await waitFor(() => true) // Wait one tick for the createDynamicLink promise to resolve

    expect(getByTestId('invite')).not.toBeDisabled()
  })

  it('should share when button is pressed', async () => {
    mockedCreateDynamicLink.mockResolvedValue('https://vlra.app/abc123')

    jest.spyOn(Share, 'share')
    ;(Share.share as jest.Mock).mockResolvedValue({
      action: Share.sharedAction,
      activityType: 'clipboard',
    })

    jest.spyOn(ValoraAnalytics, 'track')

    const { getByTestId } = getWrapper()

    await waitFor(() => true) // Wait one tick for the createDynamicLink promise to resolve

    await press(getByTestId('invite'))

    expect(Share.share).toHaveBeenCalledTimes(1)
    expect((Share.share as jest.Mock).mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "inviteWithUrl.share, {\\"shareUrl\\":\\"https://vlra.app/abc123\\"}",
        },
      ]
    `)

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect((ValoraAnalytics.track as jest.Mock).mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "invite_with_url",
        Object {
          "action": "sharedAction",
          "activityType": "clipboard",
        },
      ]
    `)
  })
})
