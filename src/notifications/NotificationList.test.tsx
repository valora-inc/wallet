import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Text } from 'react-native'
import { Provider } from 'react-redux'
import { NotificationList } from 'src/notifications/NotificationList'
import { createMockStore } from 'test/utils'

const props = () => ({
  dollarBalance: '123',
  items: ['a'],
  listItemRenderer: (item: string, key: number) => {
    return <Text>{`test-${item}`}</Text>
  },
})

describe(NotificationList, () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <NotificationList<string> {...props()} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
