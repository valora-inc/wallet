import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import HorizontalLine from 'src/components/HorizontalLine'
import { decryptComment } from 'src/identity/commentEncryption'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { dataEncryptionKeySelector } from 'src/web3/selectors'

interface Props {
  comment?: string | null
  isSend?: boolean
}

export default function CommentSection({ comment, isSend }: Props) {
  const { t } = useTranslation()
  const dek = useSelector(dataEncryptionKeySelector)
  const decryptedComment = useMemo(
    () =>
      isSend === undefined
        ? comment
        : decryptComment(comment ?? null, dek, isSend)?.comment ?? comment,
    [comment]
  )
  if (!decryptedComment) {
    return null
  }

  return (
    // Uses View instead of Fragment to workaround a glitch with LayoutAnimation
    <View>
      <HorizontalLine />
      <Text style={styles.sectionLabel}>{t('commentLabel')}</Text>
      <Text style={styles.comment}>{decryptedComment}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...fontStyles.label,
    color: colors.gray3,
    marginBottom: 4,
  },
  comment: {
    ...fontStyles.regular,
  },
})
