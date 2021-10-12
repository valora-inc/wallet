import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Text, View } from 'react-native'
import SummaryNotification from 'src/notifications/SummaryNotification'

const props = () => ({
  title: 'Test',
  detailsI18nKey: 'someI18nKey',
  icon: <View />,
  items: ['a'],
  itemRenderer: (item: string, key: number) => {
    return <Text>{`test-${item}`}</Text>
  },
  onReview: jest.fn(),
})

describe(SummaryNotification, () => {
  it('renders correctly', () => {
    const tree = render(<SummaryNotification<string> {...props()} />)
    expect(tree).toMatchSnapshot()
  })
})
