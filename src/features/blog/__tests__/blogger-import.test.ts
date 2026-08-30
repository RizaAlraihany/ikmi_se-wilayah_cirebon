import { PostStatus } from '@prisma/client'
import { prismaMock } from '@/tests/prisma-mock'
import { ValidationError } from '@/core/errors/custom-errors'
import { bloggerImportService } from '../blogger-import'
import { requirePublisher } from '@/features/cms/access'

jest.mock('@/features/cms/access', () => ({
  requirePublisher: jest.fn(),
}))

const fetchMock = jest.fn()
global.fetch = fetchMock

const actor = {
  id: 'admin-1',
  name: 'Admin Komdigi',
  roleId: 'admin_komdigi',
  departmentId: 'department-komdigi',
  positionId: null,
}
const bloggerPost = {
  id: 'blogger-123',
  title: 'Arsip Kegiatan IKMI',
  content: '<p>Konten arsip kegiatan IKMI.</p>',
  published: '2023-05-10T08:00:00.000Z',
  updated: '2023-05-11T08:00:00.000Z',
  url: 'https://example.blogspot.com/2023/05/arsip-kegiatan.html',
  labels: ['Kegiatan'],
  author: { displayName: 'Redaksi Lama IKMI' },
}

function mockBloggerResponse(items = [bloggerPost]) {
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ items }) })
}

describe('bloggerImportService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.BLOGGER_IMPORT_API_KEY = 'test-key'
    process.env.BLOGGER_IMPORT_BLOG_ID = 'test-blog-id'
    ;(requirePublisher as jest.Mock).mockResolvedValue(actor)
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock))
  })

  afterEach(() => {
    delete process.env.BLOGGER_IMPORT_API_KEY
    delete process.env.BLOGGER_IMPORT_BLOG_ID
  })

  it('refuses preview when Blogger server configuration is missing', async () => {
    delete process.env.BLOGGER_IMPORT_API_KEY

    await expect(bloggerImportService.getPreview(actor)).rejects.toBeInstanceOf(ValidationError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('marks an already imported Blogger source as duplicate in preview', async () => {
    mockBloggerResponse()
    prismaMock.post.findMany.mockResolvedValue([{ sourcePostId: bloggerPost.id }] as never)

    const preview = await bloggerImportService.getPreview(actor)

    expect(preview).toEqual([expect.objectContaining({ sourcePostId: bloggerPost.id, duplicate: true })])
    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ cache: 'no-store' }))
  })

  it('imports a selected source once with its original publication date and audit trail', async () => {
    mockBloggerResponse()
    prismaMock.category.findMany.mockResolvedValue([{ id: 'category-artikel', slug: 'artikel' }] as never)
    prismaMock.post.findFirst.mockResolvedValue(null)
    prismaMock.post.findMany.mockResolvedValue([] as never)
    prismaMock.post.create.mockResolvedValue({ id: 'post-1', slug: 'arsip-kegiatan-ikmi' } as never)
    prismaMock.auditLog.create.mockResolvedValue({} as never)

    const result = await bloggerImportService.importSelected({
      posts: [{ sourcePostId: bloggerPost.id, categoryId: 'category-artikel' }],
    }, actor)

    expect(result).toEqual({ imported: 1, skipped: 0 })
    expect(prismaMock.post.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: PostStatus.PUBLISHED,
        sourceProvider: 'BLOGGER',
        sourcePostId: bloggerPost.id,
        sourceUrl: bloggerPost.url,
        authorName: bloggerPost.author.displayName,
        publishedAt: new Date(bloggerPost.published),
      }),
    }))
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'CREATE', entity: 'Post' }),
    }))
  })
})
