// Minimal billing types for compatibility

export type Plan = {
  type: string
  price: string
  mostPopular?: boolean
}

export type BillingInfo = {
  enabled: boolean
  plans?: Plan[]
}
