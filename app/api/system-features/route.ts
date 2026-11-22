import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Return minimal system features for compatibility
  const systemFeatures = {
    sso_enforced_for_signin: false,
    sso_enforced_for_signin_protocol: '',
    sso_enforced_for_web: false,
    sso_enforced_for_web_protocol: '',
    enable_web_sso_switch_component: false,
    file_upload_limit: 15,
    support_email: '',
    replace_webapp_logo: false,
    model_load_balancing_enabled: false,
    billing: {
      enabled: false,
    },
    members: {
      invite_enabled: false,
    },
    apps: {
      max_active_apps: -1,
    },
  }

  return NextResponse.json(systemFeatures)
}
