import { Injectable, Logger } from '@nestjs/common'

type SupportedLocale = 'en' | 'ua'
type RequestedLocale = SupportedLocale | null

const GOOGLE_TARGET_LOCALE: Record<SupportedLocale, string> = {
  en: 'en',
  ua: 'uk',
}

const MAX_CACHE_ENTRIES = 5000
const MAX_CHUNK_LENGTH = 1200

@Injectable()
export class ContentLocalizationService {
  private readonly logger = new Logger(ContentLocalizationService.name)
  private readonly translationCache = new Map<string, string>()
  private readonly inFlightTranslations = new Map<string, Promise<string>>()

  resolveRequestedLocale(header?: string | null): RequestedLocale {
    if (!header?.trim()) return null

    const tokens = header
      .split(',')
      .map((part) => part.trim().split(';')[0]?.toLowerCase())
      .filter(Boolean) as string[]

    for (const token of tokens) {
      if (token === 'ua' || token.startsWith('uk')) return 'ua'
      if (token.startsWith('en')) return 'en'
    }

    return null
  }

  async localizeEvent<T extends object>(
    event: T,
    locale: RequestedLocale,
    options: { includeOrganization?: boolean; includeTickets?: boolean; includeTags?: boolean } = {},
  ): Promise<T> {
    if (!locale) return event

    const localized = await this.translateObjectFields(event, ['name', 'description', 'location'], locale)
    const includeOrganization = options.includeOrganization ?? true
    const includeTickets = options.includeTickets ?? true
    const includeTags = options.includeTags ?? true
    const source = this.asObject(event)

    const [organization, tickets, tags] = await Promise.all([
      includeOrganization && this.isPlainObject(source.organization)
        ? this.localizeOrganization(source.organization, locale, { includeEvents: false })
        : Promise.resolve(source.organization),
      includeTickets && Array.isArray(source.tickets)
        ? Promise.all(source.tickets.map((ticket) => this.localizeTicket(ticket, locale, { includeEvent: false })))
        : Promise.resolve(source.tickets),
      includeTags ? this.localizeTags(source.tags, locale) : Promise.resolve(source.tags),
    ])

    return {
      ...localized,
      organization,
      tickets,
      tags,
    } as T
  }

  async localizeOrganization<T extends object>(
    organization: T,
    locale: RequestedLocale,
    options: { includeEvents?: boolean } = {},
  ): Promise<T> {
    if (!locale) return organization

    const localized = await this.translateObjectFields(
      organization,
      ['name', 'slogan', 'description', 'category', 'city'],
      locale,
    )

    const includeEvents = options.includeEvents ?? false
    const source = this.asObject(organization)

    const [tags, events] = await Promise.all([
      this.localizeTags(source.tags, locale),
      includeEvents && Array.isArray(source.events)
        ? Promise.all(
            source.events.map((event) =>
              this.localizeEvent(event, locale, {
                includeOrganization: false,
                includeTickets: false,
                includeTags: true,
              }),
            ),
          )
        : Promise.resolve(source.events),
    ])

    return {
      ...localized,
      tags,
      events,
    } as T
  }

  async localizeTicket<T extends object>(
    ticket: T,
    locale: RequestedLocale,
    options: { includeEvent?: boolean } = {},
  ): Promise<T> {
    if (!locale) return ticket

    const localized = await this.translateObjectFields(ticket, ['name', 'description', 'private_info'], locale)
    const includeEvent = options.includeEvent ?? true
    const source = this.asObject(ticket)

    const event = includeEvent && this.isPlainObject(source.event)
      ? await this.localizeEvent(source.event, locale, {
          includeOrganization: true,
          includeTickets: false,
          includeTags: true,
        })
      : source.event

    return {
      ...localized,
      event,
    } as T
  }

  private async translateObjectFields<T extends object>(
    value: T,
    fields: string[],
    locale: RequestedLocale,
  ): Promise<T> {
    if (!locale) return value

    const source = this.asObject(value)

    const translatedEntries = await Promise.all(
      fields.map(async (field) => [field, await this.translateUnknown(source[field], locale)] as const),
    )

    return {
      ...value,
      ...Object.fromEntries(translatedEntries),
    } as T
  }

  private async translateUnknown<T>(value: T, locale: RequestedLocale): Promise<T> {
    if (!locale || typeof value !== 'string') return value
    return await this.translateText(value, locale) as T
  }

  private localizeTags(tags: unknown, locale: RequestedLocale) {
    if (!locale || !Array.isArray(tags)) return tags

    return Promise.all(
      tags.map(async (tag) => {
        if (typeof tag === 'string') {
          return this.translateText(tag, locale)
        }

        if (this.isPlainObject(tag) && typeof tag.name === 'string') {
          return {
            ...tag,
            name: await this.translateText(tag.name, locale),
          }
        }

        return tag
      }),
    )
  }

  private async translateText(text: string, locale: SupportedLocale): Promise<string> {
    if (!text.trim()) return text

    const chunks = this.splitText(text)
    const translatedChunks = await Promise.all(chunks.map((chunk) => this.translateChunk(chunk, locale)))
    return translatedChunks.join('')
  }

  private async translateChunk(text: string, locale: SupportedLocale): Promise<string> {
    const cacheKey = `${locale}:${text}`
    const cachedValue = this.translationCache.get(cacheKey)
    if (cachedValue) {
      // Refresh key recency for LRU-like eviction policy.
      this.translationCache.delete(cacheKey)
      this.translationCache.set(cacheKey, cachedValue)
      return cachedValue
    }

    const inFlight = this.inFlightTranslations.get(cacheKey)
    if (inFlight) return inFlight

    const request = this.requestTranslation(text, locale)
      .catch((error) => {
        this.logger.warn(`Translation failed for locale ${locale}: ${error instanceof Error ? error.message : 'unknown error'}`)
        return text
      })
      .finally(() => {
        this.inFlightTranslations.delete(cacheKey)
      })

    this.inFlightTranslations.set(cacheKey, request)

    const translated = await request
    this.storeInCache(cacheKey, translated)
    return translated
  }

  private async requestTranslation(text: string, locale: SupportedLocale): Promise<string> {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: 'auto',
      tl: GOOGLE_TARGET_LOCALE[locale],
      dt: 't',
      q: text,
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`translation upstream returned ${response.status}`)
      }

      const payload = await response.json() as unknown
      const translated = this.extractTranslatedText(payload)
      return translated || text
    } finally {
      clearTimeout(timeout)
    }
  }

  private extractTranslatedText(payload: unknown): string | null {
    if (!Array.isArray(payload) || !Array.isArray(payload[0])) return null

    const sentences = payload[0]
    const translated = sentences
      .map((item) => (Array.isArray(item) && typeof item[0] === 'string' ? item[0] : ''))
      .join('')

    return translated || null
  }

  private splitText(text: string): string[] {
    if (text.length <= MAX_CHUNK_LENGTH) return [text]

    const chunks: string[] = []
    let current = ''

    const pushCurrent = () => {
      if (current) {
        chunks.push(current)
        current = ''
      }
    }

    const appendSegment = (segment: string) => {
      if (!segment) return

      if (segment.length > MAX_CHUNK_LENGTH) {
        const words = segment.split(/(\s+)/)
        for (const word of words) {
          if (!word) continue
          if ((current + word).length > MAX_CHUNK_LENGTH) pushCurrent()
          if (word.length > MAX_CHUNK_LENGTH) {
            for (let index = 0; index < word.length; index += MAX_CHUNK_LENGTH) {
              const slice = word.slice(index, index + MAX_CHUNK_LENGTH)
              if (slice.length === MAX_CHUNK_LENGTH) {
                pushCurrent()
                chunks.push(slice)
              } else {
                current = slice
              }
            }
            continue
          }
          current += word
        }
        return
      }

      if ((current + segment).length > MAX_CHUNK_LENGTH) pushCurrent()
      current += segment
    }

    for (const segment of text.split(/(\n{2,}|(?<=[.!?])\s+)/)) {
      appendSegment(segment)
    }

    pushCurrent()
    return chunks.length > 0 ? chunks : [text]
  }

  private storeInCache(key: string, value: string) {
    if (this.translationCache.has(key)) {
      this.translationCache.delete(key)
    } else if (this.translationCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.translationCache.keys().next().value as string | undefined
      if (oldestKey) {
        this.translationCache.delete(oldestKey)
      }
    }

    this.translationCache.set(key, value)
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }

  private asObject<T extends object>(value: T): Record<string, unknown> {
    return value as Record<string, unknown>
  }
}