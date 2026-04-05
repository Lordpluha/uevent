import { type EventComment, eventsApi } from '@entities/Event'
import { useMe } from '@entities/User'
import { Button, Input } from '@shared/components'
import { useAppContext } from '@shared/lib'
import { useAuth } from '@shared/lib/auth-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

interface Props {
  eventId: string
}

export function EventComments({ eventId }: Props) {
  const { t } = useAppContext()
  const { isAuthenticated, accountType } = useAuth()
  const { data: me } = useMe()
  const isUser = isAuthenticated && accountType === 'user'
  const [text, setText] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['event-comments', eventId],
    queryFn: () => eventsApi.getComments(eventId, 1, 50),
  })

  const createMutation = useMutation({
    mutationFn: (content: string) => eventsApi.createComment(eventId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-comments', eventId] })
      setText('')
    },
    onError: () => toast.error(t.comments.createFailed),
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => eventsApi.deleteComment(eventId, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-comments', eventId] }),
    onError: () => toast.error(t.errors.somethingWrong),
  })

  const comments: EventComment[] = data?.data ?? []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    createMutation.mutate(text.trim())
  }

  return (
    <section className="mb-8">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <MessageSquare className="h-4 w-4" />
        {t.comments.title}{' '}
        {comments.length > 0 && <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>}
      </h2>

      {isUser && (
        <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.comments.placeholder}
            maxLength={1000}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!text.trim() || createMutation.isPending}>
            {t.comments.post}
          </Button>
        </form>
      )}

      {!isAuthenticated && <p className="mb-4 text-sm text-muted-foreground">{t.comments.loginToComment}</p>}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.comments.noComments}</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const name = comment.user
              ? [comment.user.first_name, comment.user.last_name].filter(Boolean).join(' ') || comment.user.username
              : t.common.unknown
            const isOwn = me?.id === comment.user_id
            return (
              <div key={comment.id} className="rounded-xl border border-border/60 bg-card px-4 py-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Link to={`/users/${comment.user_id}`} className="text-sm font-medium hover:underline">
                    {name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(comment.id)}
                        disabled={deleteMutation.isPending}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={t.comments.delete}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
