import LottieView from 'lottie-react-native'
import React from 'react'

const RedLoadingSpinnerToInfo = () => {
  return (
    <LottieView
      source={require('./lottie-json/redLoadingSpinnerToInfo.json')}
      autoPlay={true}
      loop={false}
      style={{ height: 64 }}
      testID="RedLoadingSpinnerToInfo"
    />
  )
}

export default RedLoadingSpinnerToInfo
