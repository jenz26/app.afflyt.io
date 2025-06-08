import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Afflyt - Preview Link',
  description: 'Preview page for affiliate links',
  robots: 'noindex, nofollow',
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}