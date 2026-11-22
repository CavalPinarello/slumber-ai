// Minimal model provider hooks for compatibility

export const useModelProviders = () => {
  return {
    providers: [],
    loading: false,
    error: null,
  }
}

export const useModelList = () => {
  return {
    models: [],
    loading: false,
  }
}

export const useLanguage = () => {
  return {
    language: 'en-US',
    setLanguage: () => {},
  }
}
