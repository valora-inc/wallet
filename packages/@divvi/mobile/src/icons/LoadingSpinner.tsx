import LottieView from 'lottie-react-native'
import React from 'react'

interface Props {
  width?: number
}

export default class LoadingSpinner extends React.PureComponent<Props> {
  animation: LottieView | null | undefined

  render() {
    const { width = 40 } = this.props
    return (
      <LottieView
        ref={(animation) => {
          this.animation = animation
        }}
        source={require('./loadingSpinnerGreen.json')}
        autoPlay={true}
        loop={true}
        style={{ width }}
      />
    )
  }
}
