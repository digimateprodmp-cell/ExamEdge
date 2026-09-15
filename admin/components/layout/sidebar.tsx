'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Coins,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Newspaper,
  ShieldCheck,
  Ticket,
  Users,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/catalog/subjects', label: 'Subjects & Topics', icon: Layers },
  { href: '/catalog/courses', label: 'Courses', icon: GraduationCap },
  { href: '/test-series', label: 'Test Series', icon: BookOpen },
  { href: '/batches', label: 'Batches', icon: Users },
  { href: '/content/notes', label: 'Notes', icon: FileText },
  { href: '/content/videos', label: 'Videos', icon: Video },
  { href: '/content/blogs', label: 'Blogs', icon: Newspaper },
  { href: '/content/current-affairs', label: 'Current Affairs', icon: Newspaper },
  { href: '/coupons', label: 'Coupons', icon: Ticket },
  { href: '/coins', label: 'Coins', icon: Coins },
  { href: '/payments', label: 'Payments', icon: CreditCard },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <span className="font-bold">Test Mela Admin</span>
      </div>
      <nav className="space-y-0.5 p-3">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
