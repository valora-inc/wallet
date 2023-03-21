import LottieView from 'lottie-react-native'
import React from 'react'

const GreenLoadingSpinner = () => {
  return (
    <LottieView
      source={require('./lottie-json/greenLoadingSpinner.json')}
      autoPlay={true}
      loop={true}
      style={{ height: 64 }}
      testID="GreenLoadingSpinner"
    />
  )
}

export default GreenLoadingSpinner
