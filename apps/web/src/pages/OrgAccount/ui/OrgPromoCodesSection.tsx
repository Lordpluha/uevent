import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@shared/api';
import { Button, Field, FieldDescription, FieldLabel, Input } from '@shared/components';

type PromoCodeModel = {
  id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  eventId: string | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

export function OrgPromoCodesSection({ onChanged }: { onChanged: () => Promise<void> }) {
  const [form, setForm] = useState({
    code: '',
    discountPercent: '10',
    eventId: '',
    maxUses: '',
  });

  const { data: promoCodes, isLoading, refetch } = useQuery({
    queryKey: ['organization-promo-codes'],
    queryFn: async () => (await api.get<PromoCodeModel[]>('/payments/promo-codes/my')).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const discountPercent = Number.parseInt(form.discountPercent, 10);
      if (!form.code.trim()) throw new Error('Code is required.');
      if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
        throw new Error('Discount must be from 1 to 100.');
      }

      return api.post('/payments/promo-codes', {
        code: form.code.trim().toUpperCase(),
        discountPercent,
        eventId: form.eventId.trim() || undefined,
        maxUses: form.maxUses.trim() ? Number.parseInt(form.maxUses, 10) : undefined,
      });
    },
    onSuccess: async () => {
      toast.success('Promo code created.');
      setForm({ code: '', discountPercent: '10', eventId: '', maxUses: '' });
      await Promise.all([refetch(), onChanged()]);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create promo code.';
      toast.error(message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (promo: PromoCodeModel) => {
      return api.post(`/payments/promo-codes/${promo.id}`, {
        isActive: !promo.isActive,
      });
    },
    onSuccess: async () => {
      await refetch();
      await onChanged();
    },
    onError: () => {
      toast.error('Failed to update promo code status.');
    },
  });

  const sortedPromoCodes = useMemo(
    () => [...(promoCodes ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [promoCodes],
  );

  return (
    <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-base font-semibold">Promo codes</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Create and manage promo codes for your organization and event sales.
      </p>

      <form
        className="mt-4 grid gap-4 rounded-lg border border-border/60 bg-background/40 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="promo-code">Code</FieldLabel>
            <Input
              id="promo-code"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              placeholder="SPRING20"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="promo-discount">Discount %</FieldLabel>
            <Input
              id="promo-discount"
              type="number"
              min={1}
              max={100}
              value={form.discountPercent}
              onChange={(e) => setForm((prev) => ({ ...prev, discountPercent: e.target.value }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="promo-event-id">Event ID (optional)</FieldLabel>
            <Input
              id="promo-event-id"
              value={form.eventId}
              onChange={(e) => setForm((prev) => ({ ...prev, eventId: e.target.value }))}
              placeholder="UUID of your event"
            />
            <FieldDescription>
              Leave empty to make it organization-wide.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="promo-max-uses">Max uses (optional)</FieldLabel>
            <Input
              id="promo-max-uses"
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(e) => setForm((prev) => ({ ...prev, maxUses: e.target.value }))}
              placeholder="Unlimited"
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create promo code'}
          </Button>
        </div>
      </form>

      <div className="mt-5 overflow-x-auto rounded-lg border border-border/60">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Discount</th>
              <th className="px-3 py-2 font-medium">Usage</th>
              <th className="px-3 py-2 font-medium">Scope</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedPromoCodes.map((promo) => (
              <tr key={promo.id} className="border-t border-border/60">
                <td className="px-3 py-2 font-medium">{promo.code}</td>
                <td className="px-3 py-2">{promo.discountPercent}%</td>
                <td className="px-3 py-2">{promo.usedCount}{promo.maxUses ? ` / ${promo.maxUses}` : ''}</td>
                <td className="px-3 py-2 text-muted-foreground">{promo.eventId ? 'Event-specific' : 'Organization-wide'}</td>
                <td className="px-3 py-2">{promo.isActive ? 'Active' : 'Inactive'}</td>
                <td className="px-3 py-2 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate(promo)}
                  >
                    {promo.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}

            {!isLoading && sortedPromoCodes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-5 text-center text-muted-foreground">
                  No promo codes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
