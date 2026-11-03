import { hasPrivateAccess } from '@/lib/private-access';
import { readPrivateJson } from '@/lib/private-content';

export const dynamic = 'force-dynamic';

/** `ok`: this visitor may open the private study material. `installed`: the material shipped with this build (says nothing about its content). */
export async function GET() {
  return Response.json({
    ok: await hasPrivateAccess(),
    installed: readPrivateJson('allowed-emails.json') !== null,
  });
}
