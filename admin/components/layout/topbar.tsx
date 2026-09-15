'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-5">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{user?.email}</span>
        <Button variant="outline" size="sm" onClick={() => logout()}>
          <LogOut className="h-3.5 w-3.5" /> Logout
        </Button>
      </div>
    </header>
  );
}
