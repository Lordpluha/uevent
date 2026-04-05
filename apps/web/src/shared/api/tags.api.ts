import { BasicClientApi } from './basic-client-api'

export type Tag = { id: string; name: string }

export interface TagsListParams {
  page?: number
  limit?: number
  search?: string
}

export interface TagsListResponse {
  data: Tag[]
  meta: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

class TagsApi extends BasicClientApi {
  constructor() {
    super('/tags')
  }

  async getAll(params?: TagsListParams): Promise<TagsListResponse> {
    const res = await this.http.get<TagsListResponse>(this.basePath, { params })
    return res.data
  }

  async findOrCreate(names: string[]): Promise<Tag[]> {
    const res = await this.http.post<Tag[]>(`${this.basePath}/find-or-create`, { names })
    return res.data
  }
}

export const tagsApi = new TagsApi()
