import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import FullscreenCTA from 'src/components/FullscreenCTA'
import { typeScale } from 'src/styles/fonts'

const styles = StyleSheet.create({
  errorMessage: {
    ...typeScale.bodyMedium,
    fontSize: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(238, 238, 238, 0.75)',
    padding: 15,
  },
})

function FullscreenCTAContentMaker(errorMessage: string) {
  return (
    <View>
      <Text style={styles.errorMessage} numberOfLines={10} ellipsizeMode="tail">
        {errorMessage}
      </Text>
    </View>
  )
}

describe('FullscreenCTA', () => {
  it('renders correctly', () => {
    const tree = render(
      <FullscreenCTA
        title={'App Update'}
        subtitle={'Please upgrade your app'}
        CTAText={'click Here!'}
        CTAHandler={jest.fn()}
      >
        {FullscreenCTAContentMaker('Update your app to make sure you are safe')}
      </FullscreenCTA>
    )
    expect(tree).toMatchSnapshot()
  })
  describe('when press the button', () => {
    it('calls the restart prop', () => {
      const restartApp = jest.fn()
      const { getByText } = render(
        <FullscreenCTA
          title={'Opps'}
          subtitle={'Something went wrong'}
          CTAText={'Restart'}
          CTAHandler={restartApp}
        >
          {FullscreenCTAContentMaker('There was an unexpected error')}
        </FullscreenCTA>
      )
      fireEvent.press(getByText('Restart'))
      expect(restartApp).toHaveBeenCalled()
    })
  })
})
