import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const HomeClient = nextDynamic(
  () => import('@/components/HomeClient').then((m) => m.HomeClient),
  { ssr: false },
);

export default function Home() {
  return <HomeClient />;
}
