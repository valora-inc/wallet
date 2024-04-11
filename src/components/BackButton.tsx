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
        // style={styles.button}
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
  // button: {
  // Quick hack to workaround hitSlop set for the internal Touchable component not working
  // I tried removing the parent view, but it didn't help either
  // paddingHorizontal: Spacing.Regular16,
  // paddingVertical: Spacing.Regular16,
  // },
})

export default BackButton
