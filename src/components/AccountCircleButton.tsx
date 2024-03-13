import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import AccountCircle from 'src/icons/AccountCircle'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'

interface Props {
  style?: StyleProp<ViewStyle>
  size?: number
  testID?: string
}

export default function AccountCircleButton({ style, size, testID }: Props) {
  const onPress = () => {
    navigate(Screens.ProfileMenu)
  }

  return (
    <TopBarIconButton
      testID={testID}
      icon={<AccountCircle size={size} />}
      onPress={onPress}
      style={style}
    />
  )
}
