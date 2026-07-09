import { IKMI_LOGO_URL } from "@/core/brand/assets";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.redirect(IKMI_LOGO_URL, 308);
}
