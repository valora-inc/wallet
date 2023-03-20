import LottieView from 'lottie-react-native'
import React from 'react'

const GreenLoadingSpinnerToCheck = () => {
  return (
    <LottieView
      source={require('./lottie-json/greenLoadingSpinnerToCheck.json')}
      autoPlay={true}
      loop={false}
      style={{ height: 64 }}
      testID="GreenLoadingSpinnerToCheck"
    />
  )
}

export default GreenLoadingSpinnerToCheck
