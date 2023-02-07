import { IClientMeta } from '@walletconnect/legacy-types'
import { CoreTypes } from '@walletconnect/types'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { activeDappSelector, dappConnectInfoSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/types'
import Logo from 'src/icons/Logo'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { getShadowStyle, Shadow, Spacing } from 'src/styles/styles'

interface RequestDetail {
  label: string
  value: string
}

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

const DAPP_IMAGE_SIZE = 40

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

  let dappOrigin = ''
  let dappHostname = ''
  try {
    const dappUrl = new URL(url)
    dappHostname = dappUrl.hostname
    dappOrigin = dappUrl.origin
  } catch {
    // do nothing if an invalid url is received, use fallback values
  }

  // create a display name in case the WC request contains an empty string
  const dappName =
    name ||
    (!!activeDapp && new URL(activeDapp.dappUrl).origin === dappOrigin
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
  children,
}: Props) {
  const { t } = useTranslation()

  const [isAccepting, setIsAccepting] = useState(false)
  const dappConnectInfo = useSelector(dappConnectInfoSelector)

  const isAcceptingRef = useRef(false)

  const handleAccept = () => {
    setIsAccepting(true)
  }

  useEffect(() => {
    isAcceptingRef.current = isAccepting
    if (isAccepting) {
      onAccept()
    }
  }, [isAccepting])

  useEffect(() => {
    return () => {
      if (!isAcceptingRef.current) {
        onDeny()
      }
    }
  }, [])

  return (
    <>
      {(dappImageUrl || dappConnectInfo === DappConnectInfo.Basic) && (
        <View style={styles.logoContainer}>
          <View style={styles.logoShadow}>
            <View style={styles.logoBackground}>
              <Logo height={24} />
            </View>
          </View>
          <View style={styles.logoShadow}>
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
        </View>
      )}
      <Text style={styles.header} testID={`${testId}Header`}>
        {title}
      </Text>
      {!!description && <Text style={styles.description}>{description}</Text>}

      {requestDetails && (
        <View style={styles.requestDetailsContainer}>
          {requestDetails.map(({ label, value }, index) =>
            value ? (
              <React.Fragment key={label}>
                <Text
                  style={[
                    styles.requestDetailLabel,
                    index > 0 ? { marginTop: Spacing.Regular16 } : undefined,
                  ]}
                >
                  {label}
                </Text>
                <Text style={styles.requestDetailValue}>{value}</Text>
              </React.Fragment>
            ) : null
          )}
        </View>
      )}

      {children}

      <Button
        type={BtnTypes.PRIMARY}
        size={BtnSizes.FULL}
        text={t('allow')}
        showLoading={isAccepting}
        disabled={isAccepting}
        onPress={handleAccept}
        testID={`${testId}/Allow`}
      />
    </>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
  },
  requestDetailsContainer: {
    marginBottom: Spacing.Thick24,
  },
  header: {
    ...fontStyles.h2,
    paddingVertical: Spacing.Regular16,
  },
  logoShadow: {
    ...getShadowStyle(Shadow.SoftLight),
    borderRadius: 100,
  },
  logoBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    height: DAPP_IMAGE_SIZE,
    width: DAPP_IMAGE_SIZE,
    borderRadius: 100,
    backgroundColor: Colors.light,
  },
  dappImage: {
    height: DAPP_IMAGE_SIZE,
    width: DAPP_IMAGE_SIZE,
    borderRadius: 100,
    backgroundColor: Colors.light,
    marginLeft: -4,
  },
  description: {
    ...fontStyles.small,
    lineHeight: 20,
    marginBottom: Spacing.Thick24,
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
  requestDetailLabel: {
    ...fontStyles.small,
    color: Colors.gray5,
    marginBottom: 4,
  },
  requestDetailValue: {
    ...fontStyles.small600,
  },
})

export default RequestContent
