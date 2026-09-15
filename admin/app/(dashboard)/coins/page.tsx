'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { coinsService } from '@/services/ops.service';
import { ApiError } from '@/lib/api';

export default function CoinsPage() {
  const { accessToken } = useAuth();
  const [userId, setUserId] = useState('');
  const [type, setType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [amount, setAmount] = useState('50');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      await coinsService.adjust(accessToken, { userId, type, amount: Number(amount), reason });
      toast.success('Coin balance adjusted');
      setUserId('');
      setReason('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not adjust coins');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Coins" description="Manually credit or debit a student's coin wallet." />
      <Card className="max-w-lg">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label>User ID</Label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Copy the user's id from the Users page" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'CREDIT' | 'DEBIT')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit (add)</SelectItem>
                  <SelectItem value="DEBIT">Debit (remove)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Contest winner bonus" />
          </div>
          <Button disabled={saving || !userId || !reason} onClick={submit}>
            Apply adjustment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
