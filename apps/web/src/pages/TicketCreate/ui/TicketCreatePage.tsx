import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { Button, Field, FieldGroup, FieldLabel, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components';

export function TicketCreatePage() {
  const { id } = useParams<{ id: string }>();
  const [ticketType, setTicketType] = useState<'free' | 'standard' | 'vip'>('standard');

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

      <form className="space-y-5 rounded-xl border border-border/60 bg-card p-5">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="ticket-name">Ticket name</FieldLabel>
            <Input id="ticket-name" placeholder="Early Bird" />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-type">Type</FieldLabel>
            <Select value={ticketType} onValueChange={(value) => setTicketType(value as 'free' | 'standard' | 'vip')}>
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
            <Input id="ticket-price" type="number" min={0} step="0.01" placeholder="0.00" disabled={ticketType === 'free'} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-quantity">Quantity</FieldLabel>
            <Input id="ticket-quantity" type="number" min={1} step={1} placeholder="100" />
          </Field>
        </FieldGroup>

        <Button type="button" disabled>
          Save ticket
        </Button>
      </form>
    </main>
  );
}
