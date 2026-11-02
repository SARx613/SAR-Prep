import { hasPrivateAccess } from '@/lib/private-access';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ ok: await hasPrivateAccess() });
}
