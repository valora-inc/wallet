import LottieView from 'lottie-react-native'
import React from 'react'

const GreenLoadingSpinner = () => {
  return (
    <LottieView
      source={require('./greenLoadingSpinner.json')}
      autoPlay={true}
      loop={true}
      style={{ height: 64 }}
      testID="GreenLoadingSpinner"
      hardwareAccelerationAndroid={true}
      enableMergePathsAndroidForKitKatAndAbove={true}
    />
  )
}

export default GreenLoadingSpinner
