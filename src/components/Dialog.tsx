import * as React from 'react'
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Modal from 'src/components/Modal'
import TextButton from 'src/components/TextButton'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

interface Props {
  image?: ImageSourcePropType
  title?: string | React.ReactNode
  children: React.ReactNode
  actionText?: string | null
  isActionHighlighted?: boolean
  actionPress?: () => void
  secondaryActionText?: string | null
  secondaryActionDisabled?: boolean
  secondaryActionPress?: () => void
  isVisible: boolean
  showLoading?: boolean
  testID?: string
  onBackgroundPress?: () => void
  onDialogHide?: () => void
}

export default function Dialog({
  title,
  children,
  actionPress,
  actionText,
  isActionHighlighted = true,
  secondaryActionText,
  secondaryActionDisabled,
  secondaryActionPress,
  showLoading = false,
  image,
  isVisible,
  testID,
  onBackgroundPress,
  onDialogHide,
}: Props) {
  return (
    <Modal
      isVisible={isVisible}
      testID={testID}
      onBackgroundPress={onBackgroundPress}
      onModalHide={onDialogHide}
    >
      <ScrollView contentContainerStyle={styles.root}>
        {!!image && <Image style={styles.imageContainer} source={image} resizeMode="contain" />}
        {!!title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.body}>{children}</Text>
      </ScrollView>
      <View style={styles.actions}>
        {!!secondaryActionText && (
          <TextButton
            style={styles.secondary}
            disabled={secondaryActionDisabled}
            onPress={secondaryActionPress}
            testID={testID ? `${testID}/SecondaryAction` : undefined}
          >
            {secondaryActionText}
          </TextButton>
        )}
        {showLoading ? (
          <ActivityIndicator style={styles.primary} size="small" color={colors.primary} />
        ) : (
          <>
            {!!actionText && (
              <TextButton
                style={isActionHighlighted ? styles.primary : styles.secondary}
                onPress={actionPress}
                testID={testID ? `${testID}/PrimaryAction` : undefined}
              >
                {actionText}
              </TextButton>
            )}
          </>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    ...typeScale.titleSmall,
  },
  body: {
    textAlign: 'center',
    ...typeScale.bodyMedium,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  secondary: {
    color: colors.gray4,
    paddingTop: 16,
  },
  primary: {
    paddingTop: 16,
  },
  imageContainer: {
    marginBottom: 12,
    width: 100,
    height: 100,
  },
})
