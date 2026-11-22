import data from './languages.json'
export type Item = {
  value: number | string
  name: string
  example: string
}

export type I18nText = {
  'en-US': string
}

export const languages = data.languages

export const LanguagesSupported = languages.filter(item => item.supported).map(item => item.value)

export const getLanguage = (locale: string) => {
  return LanguagesSupported[0].replace('-', '_')
}

const DOC_LANGUAGE: Record<string, string> = {
  'en-US': 'en',
}

export const getDocLanguage = (locale: string) => {
  return DOC_LANGUAGE[locale] || 'en'
}

const PRICING_PAGE_LANGUAGE: Record<string, string> = {
}

export const getPricingPageLanguage = (locale: string) => {
  return PRICING_PAGE_LANGUAGE[locale] || ''
}

export const NOTICE_I18N = {
  title: {
    en_US: 'Important Notice',
  },
  desc: {
    en_US:
      'Our system will be unavailable from 19:00 to 24:00 UTC on August 28 for an upgrade. For questions, kindly contact our support team (support@dify.ai). We value your patience.',
  },
  href: '#',
}
