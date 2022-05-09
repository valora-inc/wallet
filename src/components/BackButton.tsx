import React from 'react'
import { StyleSheet, View } from 'react-native'
import BackChevron, { Props as BackChevronProps } from 'src/icons/BackChevron'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton, TopBarIconButtonProps } from 'src/navigator/TopBarButton'
import variables from 'src/styles/variables'

type Props = Omit<TopBarIconButtonProps, 'icon'> & BackChevronProps

function BackButton(props: Props) {
  return (
    <View style={styles.container}>
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
    paddingLeft: variables.contentPadding + 6, // 6px from the left padding
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default BackButton
