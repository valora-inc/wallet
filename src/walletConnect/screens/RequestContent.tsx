import { useNavigation } from '@react-navigation/native'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import QuitIcon from 'src/icons/QuitIcon'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import useStateWithCallback from 'src/utils/useStateWithCallback'
import RequestContentRow, { RequestDetail } from 'src/walletConnect/screens/RequestContentRow'
import ValoraDappIcon from 'src/walletConnect/ValoraDappIcon'

interface Props {
  onAccept(): void
  onDeny(): void
  dappImageUrl: string
  title: string
  description: string
  testId: string
  requestDetails?: (Omit<RequestDetail, 'value'> & { value?: string | null })[]
  children?: React.ReactNode
}

const DAPP_IMAGE_SIZE = 60

function RequestContent({
  onAccept,
  onDeny,
  dappImageUrl,
  title,
  description,
  testId,
  requestDetails,
  children,
}: Props) {
  const { t } = useTranslation()
  const navigation = useNavigation()

  const [isAccepting, setIsAccepting] = useStateWithCallback(false)
  const [isDenying, setIsDenying] = useStateWithCallback(false)

  const isLoading = isAccepting || isDenying

  const handleAccept = () => {
    // Dispatch after state has been changed to avoid triggering the 'beforeRemove' action while processing
    setIsAccepting(true, onAccept)
  }

  const handleDeny = () => {
    // Dispatch after state has been changed to avoid triggering the 'beforeRemove' action while processing
    setIsDenying(true, onDeny)
  }

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (isLoading) {
          return
        }
        e.preventDefault()
        handleDeny()
      }),
    [navigation, handleDeny, isLoading]
  )

  return (
    <View style={styles.container}>
      <TopBarIconButton icon={<QuitIcon />} style={styles.closeButton} onPress={handleDeny} />
      <ScrollView>
        <View style={styles.logoContainer}>
          <ValoraDappIcon size={DAPP_IMAGE_SIZE} />
          <Image style={styles.logo} source={{ uri: dappImageUrl }} />
        </View>
        <Text style={styles.header} testID={`${testId}Header`}>
          {title}
        </Text>
        {description && <Text style={styles.description}>{description}</Text>}

        {requestDetails && (
          <View style={styles.detailsContainer}>
            {requestDetails.map(({ label, value, tapToCopy }) =>
              value ? (
                <RequestContentRow key={label} label={label} value={value} tapToCopy={tapToCopy} />
              ) : null
            )}
          </View>
        )}

        {children}
      </ScrollView>

      <View style={styles.buttonContainer} pointerEvents={isLoading ? 'none' : undefined}>
        <Button
          style={styles.buttonWithSpace}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.MEDIUM}
          text={t('cancel')}
          showLoading={isDenying}
          onPress={handleDeny}
          testID={`${testId}/Cancel`}
        />
        <Button
          type={BtnTypes.PRIMARY}
          size={BtnSizes.MEDIUM}
          text={t('allow')}
          showLoading={isAccepting}
          onPress={handleAccept}
          testID={`${testId}/Allow`}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  logoContainer: {
    justifyContent: 'center',
    marginVertical: Spacing.Thick24,
    flexDirection: 'row-reverse',
  },
  detailsContainer: {
    paddingVertical: Spacing.Regular16,
  },
  header: {
    ...fontStyles.h2,
    textAlign: 'center',
    paddingBottom: Spacing.Regular16,
  },
  logo: {
    height: DAPP_IMAGE_SIZE,
    width: DAPP_IMAGE_SIZE,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.gray2,
    marginRight: -Spacing.Small12,
  },
  description: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  buttonWithSpace: {
    marginRight: Spacing.Small12,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Small12,
    marginTop: 'auto',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
})

export default RequestContent
