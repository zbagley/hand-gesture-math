import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nested Title',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}
