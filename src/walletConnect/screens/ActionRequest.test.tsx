import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import { SupportedActions } from 'src/walletConnect/constants'
import ActionRequest from 'src/walletConnect/screens/ActionRequest'
import { Actions } from 'src/walletConnect/v1/actions'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('ActionRequest', () => {
  const store = createMockStore({})

  afterEach(() => {
    store.clearActions()
  })

  describe('personal_sign', () => {
    const action = {
      id: 1,
      jsonrpc: '',
      method: SupportedActions.personal_sign,
      params: [
        '0x4d65737361676520746f207369676e', // hex of 'Message to sign'
        '0xe17becad62a0a1225473bb52e620ae29728b55a0',
      ],
    }
    it('renders correctly', () => {
      const { toJSON } = render(
        <Provider store={store}>
          <ActionRequest
            {...getMockStackScreenProps(Screens.WalletConnectActionRequest, {
              dappName: 'foo',
              dappIcon: 'foo',
              dappUrl: 'foo',
              action,
              version: 1,
              peerId: 'peerId',
            })}
          />
        </Provider>
      )
      expect(toJSON()).toMatchSnapshot()
    })

    it('dispatches request details with correct string on clicking details', async () => {
      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest
            {...getMockStackScreenProps(Screens.WalletConnectActionRequest, {
              dappName: 'foo',
              dappIcon: 'foo',
              dappUrl: 'foo',
              action,
              version: 1,
              peerId: 'peerId',
            })}
          />
        </Provider>
      )
      await fireEvent.press(getByText('action.details'))
      expect(store.getActions()).toEqual([
        {
          type: Actions.SHOW_REQUEST_DETAILS_V1,
          request: action,
          peerId: 'peerId',
          infoString: 'Message to sign',
        },
      ])
    })

    it('dispatches request details with raw string if message cannot be decoded', async () => {
      action.params[0] = 'invalid hex'
      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest
            {...getMockStackScreenProps(Screens.WalletConnectActionRequest, {
              dappName: 'foo',
              dappIcon: 'foo',
              dappUrl: 'foo',
              action,
              version: 1,
              peerId: 'peerId',
            })}
          />
        </Provider>
      )
      await fireEvent.press(getByText('action.details'))
      expect(store.getActions()).toEqual([
        {
          type: Actions.SHOW_REQUEST_DETAILS_V1,
          request: action,
          peerId: 'peerId',
          infoString: 'invalid hex',
        },
      ])
    })

    it('dispatches request details with empty message', async () => {
      action.params[0] = ''
      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest
            {...getMockStackScreenProps(Screens.WalletConnectActionRequest, {
              dappName: 'foo',
              dappIcon: 'foo',
              dappUrl: 'foo',
              action,
              version: 1,
              peerId: 'peerId',
            })}
          />
        </Provider>
      )
      await fireEvent.press(getByText('action.details'))
      expect(store.getActions()).toEqual([
        {
          type: Actions.SHOW_REQUEST_DETAILS_V1,
          request: action,
          peerId: 'peerId',
          infoString: 'action.emptyMessage',
        },
      ])
    })
  })
})
