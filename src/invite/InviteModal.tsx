import * as React from 'react'
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import ShareIcon from 'src/icons/Share'
import Times from 'src/icons/Times'
import { inviteModal } from 'src/images/Images'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  title: string
  description: string
  buttonLabel: string
  disabled: boolean
  onClose(): void
  onShareInvite(): void
}

const InviteModal = ({
  title,
  description,
  buttonLabel,
  disabled,
  onClose,
  onShareInvite,
}: Props) => {
  return (
    <SafeAreaView style={styles.container}>
      <Touchable
        onPress={onClose}
        borderless={true}
        hitSlop={variables.iconHitslop}
        testID="InviteModalCloseButton"
      >
        <Times />
      </Touchable>
      <View style={styles.contentContainer}>
        <Image style={styles.imageContainer} source={inviteModal} resizeMode="contain" />
        <Text style={[fontStyles.h2, styles.text]}>{title}</Text>
        <Text style={[fontStyles.regular, styles.text]}>{description}</Text>
        <Button
          icon={<ShareIcon color={colors.light} height={24} />}
          iconPositionLeft={false}
          size={BtnSizes.SMALL}
          text={buttonLabel}
          type={BtnTypes.PRIMARY}
          disabled={disabled}
          onPress={onShareInvite}
        />
      </View>
    </SafeAreaView>
  )
}
const { height, width } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    height,
    width,
    flex: 1,
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.light,
    padding: Spacing.Thick24,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    marginBottom: Spacing.Regular16,
    width: 120,
    height: 120,
  },
  text: {
    textAlign: 'center',
    marginBottom: Spacing.Regular16,
  },
})

export default InviteModal
