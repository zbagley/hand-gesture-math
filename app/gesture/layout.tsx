import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nested Title',
};

export default function Gesture({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
