import React from 'react'
import { useTranslation } from 'react-i18next'
import { EducationStep, EducationTopic } from 'src/account/Education'
import {
  compromisedAccount,
  educationMpc1,
  educationMpc2,
  migrateAbout,
  migrateExport,
  migrateImport,
  recoveryEmail,
} from 'src/images/Images'

export enum KeyshareType {
  User = 'User',
  Recovery = 'Recovery',
}

export const useKeyshareEducation = (type: KeyshareType) => {
  const { t } = useTranslation()
  return React.useMemo(() => {
    switch (type) {
      case KeyshareType.User: {
        return [
          { image: migrateAbout, topic: EducationTopic.multiparty },
          { image: migrateExport, topic: EducationTopic.multiparty },
          { image: migrateImport, topic: EducationTopic.multiparty },
        ].map((step, index) => {
          return {
            ...step,
            title: t(`mpcGuide.${type}.${index}.title`),
            text: t(`mpcGuide.${type}.${index}.text`),
          }
        })
      }
      case KeyshareType.Recovery: {
        return [
          { image: recoveryEmail, topic: EducationTopic.multiparty },
          { image: compromisedAccount, topic: EducationTopic.multiparty },
        ].map((step, index) => {
          return {
            ...step,
            title: t(`mpcGuide.${type}.${index}.title`),
            text: t(`mpcGuide.${type}.${index}.text`),
          }
        })
      }
    }
  }, [])
}

export const useMultiPartyEducation = () => {
  const { t } = useTranslation()

  return React.useMemo(() => {
    const result: Array<EducationStep> = [
      { image: educationMpc1, topic: EducationTopic.multiparty },
      { image: educationMpc2, topic: EducationTopic.multiparty },
    ].map((step, index) => {
      return {
        ...step,
        title: t(`mpcAbout.${index}.title`),
        text: t(`mpcAbout.${index}.text`),
      }
    })
    return result
  }, [])
}
