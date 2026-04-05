import { api } from '@shared/api'
import { Button, Field, FieldDescription, FieldLabel, Input, Textarea } from '@shared/components'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

type VerificationStatus = 'not_submitted' | 'submitted' | 'approved' | 'rejected'

type OrganizationVerification = {
  id: string
  status: VerificationStatus
  additionalInformation: string | null
  documentUrls: string[] | null
  submittedAt: string | null
  reviewedAt: string | null
  reviewerComment: string | null
}

const statusText: Record<VerificationStatus, string> = {
  not_submitted: 'Not submitted',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
}

export function OrgVerificationSection({
  verification,
  onRefresh,
}: {
  verification: OrganizationVerification | undefined
  onRefresh: () => Promise<void>
}) {
  const [additionalInformation, setAdditionalInformation] = useState(verification?.additionalInformation ?? '')
  const [files, setFiles] = useState<File[]>([])

  const accepted = useMemo(() => '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx', [])

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!files.length) throw new Error('Please upload at least one document.')

      const formData = new FormData()
      for (const file of files) {
        formData.append('documents', file)
      }
      if (additionalInformation.trim()) {
        formData.append('additionalInformation', additionalInformation.trim())
      }

      return api.post('/payments/organization/verification', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
    onSuccess: async () => {
      toast.success('Verification submitted successfully.')
      setFiles([])
      await onRefresh()
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to submit verification.'
      toast.error(message)
    },
  })

  return (
    <section className="mt-5 rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-base font-semibold">Organization verification for payouts</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload legal documents and provide additional information to enable withdrawal support.
      </p>

      <div className="mt-4 rounded-lg border border-border/60 bg-background/40 p-4 text-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Current status</p>
        <p className="mt-1 font-semibold">{verification ? statusText[verification.status] : 'Not submitted'}</p>
        {verification?.submittedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted: {new Date(verification.submittedAt).toLocaleString()}
          </p>
        )}
        {verification?.reviewerComment && (
          <p className="mt-2 text-xs text-muted-foreground">Reviewer comment: {verification.reviewerComment}</p>
        )}
      </div>

      {(verification?.documentUrls?.length ?? 0) > 0 && (
        <div className="mt-4 rounded-lg border border-border/60 bg-background/40 p-4">
          <p className="text-sm font-semibold">Uploaded documents</p>
          <ul className="mt-2 space-y-1 text-sm">
            {(verification?.documentUrls ?? []).map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {url.split('/').pop()}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="mt-4 grid gap-4 rounded-lg border border-border/60 bg-background/40 p-4"
        onSubmit={(e) => {
          e.preventDefault()
          submitMutation.mutate()
        }}
      >
        <Field>
          <FieldLabel htmlFor="verification-documents">Documents</FieldLabel>
          <Input
            id="verification-documents"
            type="file"
            multiple
            accept={accepted}
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <FieldDescription>Supported: images, PDF, DOC, DOCX. Up to 10 files.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="verification-additional-info">Additional information</FieldLabel>
          <Textarea
            id="verification-additional-info"
            rows={4}
            value={additionalInformation}
            onChange={(e) => setAdditionalInformation(e.target.value)}
            placeholder="Describe your business and payout details"
          />
        </Field>

        {!!files.length && (
          <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-sm">
            <p className="font-medium">Selected files:</p>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              {files.map((file) => (
                <li key={`${file.name}-${file.size}`}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={submitMutation.isPending || files.length === 0}>
            {submitMutation.isPending ? 'Submitting...' : 'Submit verification'}
          </Button>
        </div>
      </form>
    </section>
  )
}
