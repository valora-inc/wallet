import { IClientMeta } from '@walletconnect/legacy-types'
import { CoreTypes } from '@walletconnect/types'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { activeDappSelector, dappConnectInfoSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/types'
import Logo from 'src/icons/Logo'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import RequestContentRow, { RequestDetail } from 'src/walletConnect/screens/RequestContentRow'
import { useIsDappListed } from 'src/walletConnect/screens/useIsDappListed'

interface Props {
  onAccept(): void
  onDeny(): void
  dappImageUrl?: string
  title: string
  description?: string
  testId: string
  requestDetails?: (Omit<RequestDetail, 'value'> & { value?: string | null })[]
  dappName: string
  dappUrl?: string
  children?: React.ReactNode
}

const DAPP_IMAGE_SIZE = 60

export const useDappMetadata = (metadata?: IClientMeta | CoreTypes.Metadata | null) => {
  const activeDapp = useSelector(activeDappSelector)

  if (!metadata) {
    // should never happen
    return {
      url: '',
      dappName: '',
      dappImageUrl: '',
    }
  }

  const { url, name, icons } = metadata
  const dappHostname = new URL(url).hostname

  // create a display name in case the WC request contains an empty string
  const dappName =
    name ||
    (!!activeDapp && new URL(activeDapp.dappUrl).hostname === dappHostname
      ? activeDapp.name
      : dappHostname)
  const dappImageUrl = icons[0] ?? `${url}/favicon.ico`

  return {
    url,
    dappName,
    dappImageUrl,
  }
}

function RequestContent({
  onAccept,
  onDeny,
  dappImageUrl,
  title,
  description,
  testId,
  requestDetails,
  dappName,
  dappUrl,
  children,
}: Props) {
  const { t } = useTranslation()

  const [isAccepting, setIsAccepting] = useState(false)
  const [isDenying, setIsDenying] = useState(false)
  const dappConnectInfo = useSelector(dappConnectInfoSelector)
  const isDappListed = useIsDappListed(dappUrl)

  const isLoading = useRef<boolean>()

  const handleAccept = () => {
    setIsAccepting(true)
  }

  const handleDeny = () => {
    setIsDenying(true)
  }

  useEffect(() => {
    isLoading.current = isAccepting || isDenying
    if (isAccepting) {
      onAccept()
    } else if (isDenying) {
      onDeny()
    }
  }, [isAccepting, isDenying])

  useEffect(() => {
    return () => {
      if (!isLoading.current) {
        onDeny()
      }
    }
  }, [])

  return (
    <>
      <ScrollView>
        {(dappImageUrl || dappConnectInfo === DappConnectInfo.Basic) && (
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Logo />
            </View>
            {dappImageUrl ? (
              <Image style={styles.dappImage} source={{ uri: dappImageUrl }} resizeMode="cover" />
            ) : (
              <View style={[styles.logoBackground, styles.placeholderLogoBackground]}>
                <Text allowFontScaling={false} style={styles.placeholderLogoText}>
                  {dappName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}
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

        {dappConnectInfo === DappConnectInfo.Basic && !isDappListed && (
          <Text style={styles.description}>{t('dappNotListed')}</Text>
        )}
      </ScrollView>

      <View
        style={styles.buttonContainer}
        pointerEvents={isAccepting || isDenying ? 'none' : undefined}
      >
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
    </>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    justifyContent: 'center',
    flexDirection: 'row-reverse',
  },
  detailsContainer: {
    paddingVertical: Spacing.Regular16,
  },
  header: {
    ...fontStyles.h2,
    textAlign: 'center',
    paddingTop: Spacing.Thick24,
    paddingBottom: Spacing.Regular16,
  },
  logoBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    height: DAPP_IMAGE_SIZE,
    width: DAPP_IMAGE_SIZE,
    borderRadius: 100,
    backgroundColor: Colors.gray1,
  },
  dappImage: {
    height: DAPP_IMAGE_SIZE,
    width: DAPP_IMAGE_SIZE,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.gray1,
    marginRight: -Spacing.Small12,
    backgroundColor: Colors.light,
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
  },
  placeholderLogoBackground: {
    backgroundColor: Colors.light,
    marginRight: -Spacing.Small12,
    borderColor: Colors.gray2,
    borderWidth: 1,
  },
  placeholderLogoText: {
    ...fontStyles.h1,
    lineHeight: undefined,
    color: Colors.gray4,
  },
})

export default RequestContent
