import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import InviteOptionsModal from 'src/components/InviteOptionsModal'
import { Recipient, RecipientType } from 'src/recipients/recipient'
import { getDynamicConfigParams } from 'src/statsig'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig')

const defaultAppConfigs = {
  minRequiredVersion: '0.0.0',
  inviteRewardsVersion: 'none',
  // TODO: add link to documentation for what kind of content these links should link to
  links: {
    web: '',
    tos: '',
    privacy: '',
    faq: '',
    funding: '',
    forum: '',
    swapLearnMore: '',
    transactionFeesLearnMore: '',
    inviteRewardsNftsLearnMore: '',
    inviteRewardsStableTokenLearnMore: '',
    earnStablecoinsLearnMore: '',
    celoEducation: '',
    dappList: '',
    celoNews: '',
  },
}

it('renders correctly with invite rewards disabled', () => {
  jest.mocked(getDynamicConfigParams).mockImplementation(({ configName }) => {
    if (configName === StatsigDynamicConfigs.APP_CONFIG) {
      return { ...defaultAppConfigs, inviteRewardsVersion: 'none' }
    }
    return {} as any
  })
  const recipient: Recipient = {
    name: 'John Doe',
    address: '0x123000',
    recipientType: RecipientType.Address,
  }

  const tree = render(
    <Provider
      store={createMockStore({
        web3: {
          account: '0xabc123',
        },
        app: {
          phoneNumberVerified: false,
        },
      })}
    >
      <InviteOptionsModal
        recipient={recipient}
        onClose={() => {
          return null
        }}
      />
    </Provider>
  )

  expect(tree.getByTestId('InviteModalStyledDescription')).toHaveTextContent('inviteModal.body')
})

it('renders correctly with invite rewards NFTs', () => {
  jest.mocked(getDynamicConfigParams).mockImplementation(({ configName }) => {
    if (configName === StatsigDynamicConfigs.APP_CONFIG) {
      return { ...defaultAppConfigs, inviteRewardsVersion: 'v4' }
    }
    return {} as any
  })
  const recipient: Recipient = {
    name: 'John Doe',
    address: '0x123000',
    recipientType: RecipientType.Address,
  }

  const tree = render(
    <Provider
      store={createMockStore({
        web3: {
          account: '0xabc123',
        },
        app: {
          phoneNumberVerified: true,
        },
      })}
    >
      <InviteOptionsModal
        recipient={recipient}
        onClose={() => {
          return null
        }}
      />
    </Provider>
  )
  expect(tree.getByTestId('InviteModalStyledDescription')).toHaveTextContent(
    'inviteModal.rewardsActive.body, {"contactName":"John Doe"}'
  )
})

it('renders correctly with invite rewards cUSD', () => {
  jest.mocked(getDynamicConfigParams).mockImplementation(({ configName }) => {
    if (configName === StatsigDynamicConfigs.APP_CONFIG) {
      return { ...defaultAppConfigs, inviteRewardsVersion: 'v5' }
    }
    return {} as any
  })
  const recipient: Recipient = {
    name: 'John Doe',
    address: '0x123000',
    recipientType: RecipientType.Address,
  }

  const tree = render(
    <Provider
      store={createMockStore({
        web3: {
          account: '0xabc123',
        },
        app: {
          phoneNumberVerified: true,
        },
      })}
    >
      <InviteOptionsModal
        recipient={recipient}
        onClose={() => {
          return null
        }}
      />
    </Provider>
  )
  expect(tree.getByTestId('InviteModalStyledDescription')).toHaveTextContent(
    'inviteModal.rewardsActiveCUSD.body, {"contactName":"John Doe"}'
  )
})
