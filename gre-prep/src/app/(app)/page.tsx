import { getChapters, getSet } from '@/content';
import { LogoMark } from '@/components/Logo';
import { HomePanel, type HomeLesson } from '@/components/home/HomePanel';
import wordsData from '../../../public/words.json';


export default function Home() {
  const lessons: HomeLesson[] = getChapters().flatMap((ch) =>
    ch.lessons.filter((l) => l.available).map((l) => ({
      id: l.meta.id, chapter: ch.id, title: l.meta.title, section: ch.track,
      qids: getSet(l.meta.id).map((q) => q.id),
    })),
  );
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight"><LogoMark size={44} className="lg:hidden" /><span>SAR Prep</span></h1>
      <p className="mt-1 mb-6 text-muted">Your GRE, one short lesson and one practice set at a time.</p>
      <HomePanel lessons={lessons} wordTotal={(wordsData as unknown[]).length} />
    </div>
  );
}
