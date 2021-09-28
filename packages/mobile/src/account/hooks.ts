import { useCallback } from 'react'
import Inquiry, { Environment, InquiryAttributes } from 'react-native-persona'

export function useLaunchPersonaInquiry() {
  const templateId = 'tmpl_zXHYe4JZnuwfMxhzkpmdm45b'
  return useCallback(() => {
    Inquiry.fromTemplate(templateId)
      .environment(Environment.SANDBOX)
      .onSuccess((inquiryId: string, attributes: InquiryAttributes) => {
        console.log(`Inquiry completed for ${inquiryId} with attributes: ${attributes}`)
      })
      .onCancelled(() => {
        console.log('Inquiry #{inquiryId} canceled.')
      })
      .onError((error: Error) => {
        console.error(`Error: ${error.message}`)
      })
      .build()
      .start()
  }, [templateId])
}
