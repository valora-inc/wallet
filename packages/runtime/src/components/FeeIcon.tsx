import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import Dialog from 'src/components/Dialog'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import { iconHitslop } from 'src/styles/variables'

interface Props {
  title: string | React.ReactNode
  description: string | React.ReactNode
  dismissText: string
}

interface State {
  isOpen: boolean
}

class FeeIcon extends React.Component<Props, State> {
  state = {
    isOpen: false,
  }

  onDismiss = () => {
    this.setState({ isOpen: false })
  }

  onIconPress = () => {
    this.setState({ isOpen: true })
  }

  render() {
    const { isOpen } = this.state
    const { title, description, dismissText } = this.props
    return (
      <>
        <Touchable
          onPress={this.onIconPress}
          style={styles.area}
          borderless={true}
          hitSlop={iconHitslop}
        >
          <InfoIcon size={12} />
        </Touchable>
        <Dialog
          title={title}
          isVisible={isOpen}
          actionText={dismissText}
          actionPress={this.onDismiss}
          isActionHighlighted={false}
          onBackgroundPress={this.onDismiss}
        >
          {description}
        </Dialog>
      </>
    )
  }
}

export const ExchangeFeeIcon = () => {
  const { t } = useTranslation()
  return (
    <FeeIcon
      title={t('exchangeFee')}
      description={t('feeExchangeEducation')}
      dismissText={t('dismiss')}
    />
  )
}

export const SecurityFeeIcon = () => {
  const { t } = useTranslation()
  return (
    <FeeIcon title={t('securityFee')} description={t('feeEducation')} dismissText={t('dismiss')} />
  )
}

export const EncryptionFeeIcon = () => {
  const { t } = useTranslation()
  return (
    <FeeIcon
      title={t('encryption.feeLabel')}
      description={t('encryption.feeModalBody')}
      dismissText={t('dismiss')}
    />
  )
}

const styles = StyleSheet.create({
  area: {
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
})
