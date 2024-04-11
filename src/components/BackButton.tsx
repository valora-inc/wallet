import React from 'react'
import { StyleSheet, View } from 'react-native'
import BackChevron, { Props as BackChevronProps } from 'src/icons/BackChevron'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButtonProps, TopBarIconButtonV2 } from 'src/navigator/TopBarButton'
// import { TopBarIconButtonProps, TopBarIconButtonV2, TopBarIconButton } from 'src/navigator/TopBarButton'

type Props = Omit<TopBarIconButtonProps, 'icon'> & BackChevronProps

function BackButton(props: Props) {
  return (
    <View style={[styles.container, props.style]}>
      <TopBarIconButtonV2
        {...props}
        // Removing button style as it is no longer necessary
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
  // Removing button style as it is no longer necessary
})

export default BackButton
