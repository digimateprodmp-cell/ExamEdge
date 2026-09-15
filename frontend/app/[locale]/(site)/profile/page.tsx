'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import { RequireAuth } from '@/components/shared/require-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { authService } from '@/services/auth.service';
import { usersService } from '@/services/users.service';
import { ApiError } from '@/lib/api';
import type { User } from '@/types';

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const t = useTranslations('profile');
  const { user, accessToken, setUser, logout } = useAuth();
  const router = useRouter();

  if (!user || !accessToken) return null;

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {user.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.role}</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('accountInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <NameField name={user.name} token={accessToken} onSaved={setUser} />

          <VerifyRow
            label={t('emailAddress')}
            value={user.email}
            verified={user.isEmailVerified}
            onSendOtp={() => authService.sendEmailOtp(accessToken)}
            onVerify={(code) => authService.verifyEmailOtp(accessToken, code)}
            verifiedLabel={t('verified')}
            notVerifiedLabel={t('notVerified')}
            sendLabel={t('sendOtp')}
            verifyLabel={t('verifyOtp')}
          />

          {user.phone && (
            <VerifyRow
              label={t('mobileNumber')}
              value={user.phone}
              verified={user.isPhoneVerified}
              onSendOtp={() => authService.sendPhoneOtp(accessToken, user.phone!)}
              onVerify={(code) => authService.verifyPhoneOtp(accessToken, code)}
              verifiedLabel={t('verified')}
              notVerifiedLabel={t('notVerified')}
              sendLabel={t('sendOtp')}
              verifyLabel={t('verifyOtp')}
            />
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('security')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm token={accessToken} />
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">{t('dangerZoneDesc')}</p>
          <Button
            variant="destructive"
            onClick={async () => {
              if (!confirm(t('dangerZoneDesc'))) return;
              await usersService.deleteSelf(accessToken);
              await logout();
              router.push('/');
            }}
          >
            {t('deleteAccount')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NameField({
  name,
  token,
  onSaved,
}: {
  name: string;
  token: string;
  onSaved: (user: User) => void;
}) {
  const t = useTranslations('profile');
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await usersService.updateProfile(token, { name: value });
      onSaved(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 space-y-1.5">
        <Label>{t('fullName')}</Label>
        <Input value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <Button variant="outline" onClick={save} disabled={saving || value === name}>
        {t('change')}
      </Button>
    </div>
  );
}

function VerifyRow({
  label,
  value,
  verified,
  onSendOtp,
  onVerify,
  verifiedLabel,
  notVerifiedLabel,
  sendLabel,
  verifyLabel,
}: {
  label: string;
  value: string;
  verified: boolean;
  onSendOtp: () => Promise<unknown>;
  onVerify: (code: string) => Promise<unknown>;
  verifiedLabel: string;
  notVerifiedLabel: string;
  sendLabel: string;
  verifyLabel: string;
}) {
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [isVerified, setIsVerified] = useState(verified);
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-medium">{value}</p>
        </div>
        {isVerified ? (
          <span className="flex items-center gap-1 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" /> {verifiedLabel}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4" /> {notVerifiedLabel}
          </span>
        )}
      </div>

      {!isVerified && (
        <div className="mt-3">
          {!otpSent ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onSendOtp();
                  setOtpSent(true);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {sendLabel}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" className="w-32" />
              <Button
                size="sm"
                disabled={busy || code.length !== 6}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await onVerify(code);
                    setIsVerified(true);
                    toast.success('Verified successfully');
                  } catch (err) {
                    toast.error(err instanceof ApiError ? err.message : 'Invalid code');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {verifyLabel}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PasswordChangeForm({ token }: { token: string }) {
  const t = useTranslations('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await authService.changePassword(token, currentPassword, newPassword);
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>{t('currentPassword')}</Label>
        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>New password</Label>
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </div>
      <Button
        variant="outline"
        disabled={saving || !currentPassword || newPassword.length < 8}
        onClick={save}
      >
        {t('updatePassword')}
      </Button>
    </div>
  );
}
