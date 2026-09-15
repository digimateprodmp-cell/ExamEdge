import Link from 'next/link';
import { BookOpen, Coins, CreditCard, FileText, GraduationCap, Newspaper, Ticket, Users, Video } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';

const TILES = [
  { href: '/users', label: 'Users', icon: Users, desc: 'Manage student & admin accounts' },
  { href: '/catalog/courses', label: 'Courses', icon: GraduationCap, desc: 'Courses, subjects & topics' },
  { href: '/test-series', label: 'Test Series', icon: BookOpen, desc: 'Volumes, tests & questions' },
  { href: '/batches', label: 'Batches', icon: Users, desc: 'Live batches' },
  { href: '/content/notes', label: 'Notes', icon: FileText, desc: 'Note volumes & PDFs' },
  { href: '/content/videos', label: 'Videos', icon: Video, desc: 'Lecture videos' },
  { href: '/content/blogs', label: 'Blogs', icon: Newspaper, desc: 'Blog posts & categories' },
  { href: '/content/current-affairs', label: 'Current Affairs', icon: Newspaper, desc: 'Daily updates' },
  { href: '/coupons', label: 'Coupons', icon: Ticket, desc: 'Discounts & usage limits' },
  { href: '/coins', label: 'Coins', icon: Coins, desc: 'Adjust student coin balances' },
  { href: '/payments', label: 'Payments', icon: CreditCard, desc: 'Order & transaction history' },
];

export default function OverviewPage() {
  return (
    <div>
      <PageHeader title="Overview" description="Manage Test Mela's content, users and commerce." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <tile.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">{tile.label}</p>
              <p className="text-sm text-muted-foreground">{tile.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
