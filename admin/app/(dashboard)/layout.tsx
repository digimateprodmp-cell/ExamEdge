import { RequireAdmin } from '@/components/shared/require-admin';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Topbar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </RequireAdmin>
  );
}
