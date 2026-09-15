'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Coins as CoinsIcon, MinusCircle, PlusCircle } from 'lucide-react';
import { RequireAuth } from '@/components/shared/require-auth';
import { EmptyState } from '@/components/shared/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { coinsService } from '@/services/wallet.service';
import type { CoinTransaction } from '@/types';

export default function CoinsPage() {
  return (
    <RequireAuth>
      <CoinsContent />
    </RequireAuth>
  );
}

function CoinsContent() {
  const t = useTranslations('coins');
  const { accessToken, user } = useAuth();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    coinsService.transactions(accessToken).then(setTransactions).catch(() => setTransactions([]));
  }, [accessToken]);

  const credits = transactions.filter((tx) => tx.type === 'CREDIT');
  const debits = transactions.filter((tx) => tx.type === 'DEBIT');

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-8 text-center text-primary-foreground">
        <p className="opacity-80">{t('totalBalance')}</p>
        <p className="mt-1 flex items-center justify-center gap-2 text-4xl font-extrabold">
          <CoinsIcon className="h-8 w-8" /> {user?.coinBalance ?? 0}
        </p>
      </div>

      <Tabs defaultValue="credit">
        <TabsList>
          <TabsTrigger value="credit">{t('credit')}</TabsTrigger>
          <TabsTrigger value="debit">{t('debit')}</TabsTrigger>
        </TabsList>
        <TabsContent value="credit">
          <TransactionList items={credits} kind="credit" empty={t('noTransactions')} />
        </TabsContent>
        <TabsContent value="debit">
          <TransactionList items={debits} kind="debit" empty={t('noTransactions')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TransactionList({
  items,
  kind,
  empty,
}: {
  items: CoinTransaction[];
  kind: 'credit' | 'debit';
  empty: string;
}) {
  if (items.length === 0) return <EmptyState title={empty} className="mt-4" />;

  return (
    <div className="mt-2 space-y-2">
      {items.map((tx) => (
        <div key={tx.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              kind === 'credit' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            }`}
          >
            {kind === 'credit' ? <PlusCircle className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">{tx.reason}</p>
            <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
          </div>
          <span className={`font-semibold ${kind === 'credit' ? 'text-success' : 'text-destructive'}`}>
            {kind === 'credit' ? '+' : '-'}
            {tx.amount}
          </span>
        </div>
      ))}
    </div>
  );
}
