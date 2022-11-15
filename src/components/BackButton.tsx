import React from 'react'
import { StyleSheet, View } from 'react-native'
import BackChevron, { Props as BackChevronProps } from 'src/icons/BackChevron'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton, TopBarIconButtonProps } from 'src/navigator/TopBarButton'

type Props = Omit<TopBarIconButtonProps, 'icon'> & BackChevronProps

function BackButton(props: Props) {
  return (
    <View style={[styles.container, props.style]}>
      <TopBarIconButton
        {...props}
        icon={<BackChevron color={props.color} height={props.height} />}
      />
    </View>
  )
}

BackButton.defaultProps = {
  onPress: navigateBack,
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default BackButton
