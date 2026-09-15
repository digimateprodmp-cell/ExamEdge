'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { ApiError } from '@/lib/api';

const INDIAN_STATES = [
  'Bihar', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan', 'Delhi', 'Maharashtra',
  'West Bengal', 'Jharkhand', 'Haryana', 'Punjab', 'Gujarat', 'Other',
];

const schema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().regex(/^[0-9]{10}$/),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    state: z.string().optional(),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordMismatch',
  });

type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        state: values.state,
        referralCode: values.referralCode || undefined,
      });
      toast.success(t('registerSuccess'));
      router.push('/dashboard');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t('name')}</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{tv('required')}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{tv('invalidEmail')}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t('phone')}</Label>
          <Input id="phone" inputMode="numeric" {...register('phone')} />
          {errors.phone && <p className="text-xs text-destructive">{tv('invalidPhone')}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="password">{t('password')}</Label>
          <Input id="password" type="password" {...register('password')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
          <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-xs text-destructive">{tv('passwordMismatch')}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="state">{t('state')}</Label>
        <Select value={watch('state')} onValueChange={(value) => setValue('state', value)}>
          <SelectTrigger id="state">
            <SelectValue placeholder={t('selectState')} />
          </SelectTrigger>
          <SelectContent>
            {INDIAN_STATES.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="referralCode">{t('referralCode')}</Label>
        <Input id="referralCode" {...register('referralCode')} />
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {t('createAccount')}
      </Button>
    </form>
  );
}
