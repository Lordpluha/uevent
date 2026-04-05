import { useEvent } from '@entities/Event'
import { useMyOrg } from '@entities/Organization'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components'
import { useAppContext } from '@shared/lib'
import { useAuth } from '@shared/lib/auth-context'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { submitTicket } from './submitTicket'
import { type TicketForm, ticketFormSchema } from './ticketFormSchema'

export function TicketCreatePage() {
  const { t } = useAppContext()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, accountType, isReady } = useAuth()
  const { data: myOrg, isLoading: myOrgLoading } = useMyOrg()
  const { data: event, isLoading: eventLoading } = useEvent(id ?? '')
  const [ticketType, setTicketType] = useState<'free' | 'standard' | 'vip'>('standard')
  const [quantityLimited, setQuantityLimited] = useState(false)

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
  })

  if (!isReady) return null
  if (!isAuthenticated || accountType !== 'organization') {
    return <Navigate to="/" replace />
  }

  if (!id) return <Navigate to="/events" replace />

  if (myOrgLoading || eventLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    )
  }

  const isOwner = Boolean(myOrg?.id && event?.organizerOrgId === myOrg.id)
  if (!isOwner) {
    return <Navigate to={`/events/${id}`} replace />
  }

  const onSubmit = async (data: TicketForm) => {
    await submitTicket(data, {
      ticketType,
      quantityLimited,
      eventId: id,
      onSuccess: () => navigate(`/events/${id}`),
      successMessage: t.ticketCreate.created,
      fallbackError: t.ticketCreate.createFailed,
    })
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        to={id ? `/events/${id}` : '/events'}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t.common.backToEvent}
      </Link>

      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">{t.ticketCreate.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t.ticketCreate.eventId.replace('{{id}}', id ?? t.ticketCreate.unknownId)}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border border-border/60 bg-card p-5">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="ticket-name">{t.ticketCreate.ticketName}</FieldLabel>
            <Input id="ticket-name" placeholder={t.ticketCreate.ticketNamePlaceholder} {...register('name')} />
            <FieldError errors={errors.name ? [errors.name] : undefined} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-description">{t.ticketCreate.ticketDescription}</FieldLabel>
            <Input
              id="ticket-description"
              placeholder={t.ticketCreate.ticketDescPlaceholder}
              {...register('description')}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-type">{t.ticketCreate.type}</FieldLabel>
            <Select
              value={ticketType}
              onValueChange={(value) => {
                const nextType = value as 'free' | 'standard' | 'vip'
                setTicketType(nextType)
                setValue('ticketType', nextType, { shouldValidate: true })
                if (nextType === 'free') setValue('price', 0, { shouldValidate: true })
              }}
            >
              <SelectTrigger id="ticket-type">
                <SelectValue placeholder={t.ticketCreate.typePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">{t.common.free}</SelectItem>
                <SelectItem value="standard">{t.common.standard}</SelectItem>
                <SelectItem value="vip">{t.common.vip}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-price">{t.common.price}</FieldLabel>
            <Input
              id="ticket-price"
              type="number"
              min={0}
              step="0.01"
              placeholder={t.ticketCreate.pricePlaceholder}
              disabled={ticketType === 'free'}
              {...register('price', { valueAsNumber: true })}
            />
            <FieldError errors={errors.price ? [errors.price] : undefined} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-quantity-mode">{t.common.quantity}</FieldLabel>
            <Select
              value={quantityLimited ? 'limited' : 'unlimited'}
              onValueChange={(value) => {
                const limited = value === 'limited'
                setQuantityLimited(limited)
                setValue('quantityLimited', limited, { shouldValidate: true })
                if (!limited) setValue('quantityTotal', undefined, { shouldValidate: true })
              }}
            >
              <SelectTrigger id="ticket-quantity-mode">
                <SelectValue placeholder={t.ticketCreate.quantityMode} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">{t.ticketCreate.unlimited}</SelectItem>
                <SelectItem value="limited">{t.ticketCreate.limited}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {quantityLimited && (
            <Field>
              <FieldLabel htmlFor="ticket-quantity-total">{t.ticketCreate.availableAmount}</FieldLabel>
              <Input
                id="ticket-quantity-total"
                type="number"
                min={1}
                step={1}
                placeholder={t.ticketCreate.quantityPlaceholder}
                {...register('quantityTotal', { valueAsNumber: true })}
              />
              <FieldError errors={errors.quantityTotal ? [errors.quantityTotal] : undefined} />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="ticket-start">{t.ticketCreate.startDatetime}</FieldLabel>
            <Input id="ticket-start" type="datetime-local" {...register('datetimeStart')} />
            <FieldError errors={errors.datetimeStart ? [errors.datetimeStart] : undefined} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-end">{t.ticketCreate.endDatetime}</FieldLabel>
            <Input id="ticket-end" type="datetime-local" {...register('datetimeEnd')} />
            <FieldError errors={errors.datetimeEnd ? [errors.datetimeEnd] : undefined} />
          </Field>

          <Field>
            <FieldLabel htmlFor="ticket-private-info">{t.ticketCreate.privateInfo}</FieldLabel>
            <Input
              id="ticket-private-info"
              placeholder={t.ticketCreate.privateInfoPlaceholder}
              {...register('privateInfo')}
            />
          </Field>
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t.common.saving : t.ticketCreate.saveTicket}
        </Button>
      </form>
    </main>
  )
}
