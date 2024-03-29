import i18n from 'src/i18n'

export const getContentForCurrentLang = (content: { [lang: string]: any }) => {
  const language = i18n.language?.toLowerCase() ?? 'en'
  const texts = content[language] || content[language.slice(0, 2)] || content.en

  if (typeof texts === 'string') {
    return texts
  }

  for (const key of Object.keys(texts)) {
    if (typeof texts[key] === 'string') {
      // This is needed for newlines to show properly.
      texts[key] = texts[key].replace(/\\n/g, '\n')
    }
  }
  return texts
}
