// Minimal access control service for compatibility

export const checkAccess = () => {
  return Promise.resolve(true)
}

export const useGetUserCanAccessApp = (params?: any) => {
  return {
    isPending: false,
    data: { result: true },
    error: null,
  }
}
