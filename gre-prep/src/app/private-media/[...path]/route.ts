import fs from 'node:fs/promises';
import path from 'node:path';
import { hasPrivateAccess } from '@/lib/private-access';

/* Figures and explanation crops of the private study material, served only to
 * allowed users. Everything is resolved inside private/media. */

const ROOT = path.join(process.cwd(), 'private', 'media');
const TYPES: Record<string, string> = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!(await hasPrivateAccess())) return new Response('Not found', { status: 404 });
  const { path: parts } = await params;
  const file = path.resolve(ROOT, ...parts);
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type || !file.startsWith(ROOT + path.sep)) return new Response('Not found', { status: 404 });
  try {
    const body = await fs.readFile(file);
    return new Response(new Uint8Array(body), {
      headers: { 'Content-Type': type, 'Cache-Control': 'private, max-age=3600' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
