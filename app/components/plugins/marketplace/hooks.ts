// Minimal plugin marketplace hooks for compatibility

export const useMarketplace = () => {
  return {
    plugins: [],
    loading: false,
    error: null,
  }
}
