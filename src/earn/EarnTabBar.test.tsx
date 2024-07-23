import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import EarnTabBar from 'src/earn/EarnTabBar'
import { EarnTabType } from 'src/earn/types'
import Colors from 'src/styles/colors'

describe('EarnTabBar', () => {
  const onChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all tab bar items', () => {
    const { getAllByTestId } = render(
      <EarnTabBar activeTab={EarnTabType.OpenPools} onChange={onChange} />
    )

    const tabItems = getAllByTestId('Earn/TabBarItem')
    expect(tabItems).toHaveLength(2)
    expect(tabItems[0]).toHaveTextContent('openPools')
    expect(tabItems[0].children[0]).toHaveStyle({ color: Colors.black })
    expect(tabItems[1]).toHaveTextContent('myPools')
    expect(tabItems[1].children[0]).toHaveStyle({ color: Colors.gray4 })
  })

  it.each([{ tab: EarnTabType.OpenPools }, { tab: EarnTabType.MyPools }])(
    'selecting tab $tab invokes on change',
    ({ tab }) => {
      const { getAllByTestId } = render(
        <EarnTabBar activeTab={EarnTabType.OpenPools} onChange={onChange} />
      )

      fireEvent.press(getAllByTestId('Earn/TabBarItem')[tab])
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith(tab)
    }
  )
})
