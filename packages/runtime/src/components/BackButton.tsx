import React from 'react'
import { StyleSheet, View } from 'react-native'
import BackChevron, { Props as BackChevronProps } from 'src/icons/BackChevron'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton, TopBarIconButtonProps } from 'src/navigator/TopBarButton'
import { Spacing } from 'src/styles/styles'

type Props = Omit<TopBarIconButtonProps, 'icon'> & BackChevronProps

function BackButton(props: Props) {
  return (
    <View style={[styles.container, props.style]}>
      <TopBarIconButton
        {...props}
        style={styles.button}
        icon={<BackChevron color={props.color} height={props.height} />}
      />
    </View>
  )
}

BackButton.defaultProps = {
  onPress: navigateBack,
  ...BackChevron.defaultProps,
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    // Quick hack to workaround hitSlop set for the internal Touchable component not working
    // I tried removing the parent view, but it didn't help either
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Small12, // vertical padding slightly smaller so the ripple effect isn't cut off
    left: -Spacing.Regular16,
  },
})

export default BackButton
