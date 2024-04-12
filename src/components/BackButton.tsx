import React from 'react'
import BackChevron, { Props as BackChevronProps } from 'src/icons/BackChevron'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButtonProps, TopBarIconButtonV2 } from 'src/navigator/TopBarIconButtonV2'
// import { TopBarIconButtonProps, TopBarIconButtonV2, TopBarIconButton } from 'src/navigator/TopBarButton'

type Props = Omit<TopBarIconButtonProps, 'icon'> & BackChevronProps

function BackButton(props: Props) {
  return (
    <TopBarIconButtonV2 {...props} icon={<BackChevron color={props.color} size={props.size} />} />
  )
}

BackButton.defaultProps = {
  onPress: navigateBack,
}

export default BackButton
