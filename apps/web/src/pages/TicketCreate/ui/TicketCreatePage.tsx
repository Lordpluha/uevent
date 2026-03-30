import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';
import { Button, Field, FieldError, FieldGroup, FieldLabel, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components';
import { useAuth } from '@shared/lib/auth-context';
import { useMyOrg } from '@entities/Organization';
import { useEvent } from '@entities/Event';
import { ticketFormSchema, type TicketForm } from './ticketFormSchema';
import { submitTicket } from './submitTicket';

export function TicketCreatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, accountType } = useAuth();
  const { data: myOrg, isLoading: myOrgLoading } = useMyOrg();
  const { data: event, isLoading: eventLoading } = useEvent(id ?? '');
  const [ticketType, setTicketType] = useState<'free' | 'standard' | 'vip'>('standard');
  const [quantityLimited, setQuantityLimited] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<TicketForm>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      ticketType: 'standard',
      price: 0,
      quantityLimited: false,
    },
  });

  if (!isAuthenticated || accountType !== 'organization') {
    return <Navigate to="/" replace />;
  }

  if (!id) return <Navigate to="/events" replace />;

  if (myOrgLoading || eventLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  const isOwner = Boolean(myOrg?.id && event?.organizer === myOrg.id);
  if (!isOwner) {
    return <Navigate to={`/events/${id}`} replace />;
  }

  const onSubmit = async (data: TicketForm) => {
    await submitTicket(data, { ticketType, quantityLimited, eventId: id!, onSuccess: () => navigate(`/events/${id}`) });
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        to={id ? `/events/${id}` : '/events'}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to event
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Create ticket</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Event ID: {id ?? 'unknown'}. UI scaffold for organizer ticket setup.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border border-border/60 bg-card p-5">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="ticket-name">Ticket name</FieldLabel>
            <Input id="ticket-name" placeholder="Early Bird" {...register('name')} />
            <FieldError errors={errors.name ? [errors.name] : undefined} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-description">Description</FieldLabel>
            <Input id="ticket-description" placeholder="Ticket details" {...register('description')} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-type">Type</FieldLabel>
            <Select
              value={ticketType}
              onValueChange={(value) => {
                const nextType = value as 'free' | 'standard' | 'vip';
                setTicketType(nextType);
                setValue('ticketType', nextType, { shouldValidate: true });
                if (nextType === 'free') setValue('price', 0, { shouldValidate: true });
              }}
            >
              <SelectTrigger id="ticket-type">
                <SelectValue placeholder="Choose type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-price">Price</FieldLabel>
            <Input
              id="ticket-price"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              disabled={ticketType === 'free'}
              {...register('price', { valueAsNumber: true })}
            />
            <FieldError errors={errors.price ? [errors.price] : undefined} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-quantity-mode">Quantity</FieldLabel>
            <Select
              value={quantityLimited ? 'limited' : 'unlimited'}
              onValueChange={(value) => {
                const limited = value === 'limited';
                setQuantityLimited(limited);
                setValue('quantityLimited', limited, { shouldValidate: true });
                if (!limited) setValue('quantityTotal', undefined, { shouldValidate: true });
              }}
            >
              <SelectTrigger id="ticket-quantity-mode">
                <SelectValue placeholder="Select quantity mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">Unlimited</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {quantityLimited && (
            <Field>
              <FieldLabel htmlFor="ticket-quantity-total">Available amount</FieldLabel>
              <Input
                id="ticket-quantity-total"
                type="number"
                min={1}
                step={1}
                placeholder="100"
                {...register('quantityTotal', { valueAsNumber: true })}
              />
              <FieldError errors={errors.quantityTotal ? [errors.quantityTotal] : undefined} />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="ticket-start">Start datetime</FieldLabel>
            <Input id="ticket-start" type="datetime-local" {...register('datetimeStart')} />
            <FieldError errors={errors.datetimeStart ? [errors.datetimeStart] : undefined} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-end">End datetime</FieldLabel>
            <Input id="ticket-end" type="datetime-local" {...register('datetimeEnd')} />
            <FieldError errors={errors.datetimeEnd ? [errors.datetimeEnd] : undefined} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-private-info">Private info</FieldLabel>
            <Input id="ticket-private-info" placeholder="Internal notes" {...register('privateInfo')} />
          </Field>
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save ticket'}
        </Button>
      </form>
    </main>
  );
}
