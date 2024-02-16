import Link from 'next/link';

export default function Home() {
  return (
    <section>
      <h1>Hello World!</h1>
      <Link href="/test">Link</Link>
    </section>
  );
}
