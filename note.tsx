import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { PostCard } from "@/components/post-card"
import { Pagination } from "@/components/pagination"
import { requireAuth } from "@/lib/auth"
import { getPosts } from "@/lib/actions"
import { Plus } from "lucide-react"

export const metadata: Metadata = {
  title: "Posts - Bulletin Board",
  description: "View all posts",
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const user = await requireAuth()
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const { posts, pagination } = await getPosts(page)

  return (
    <div className="min-h-screen flex flex-col">
      <Header userName={user.name} />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Posts</h1>
          <Button asChild>
            <Link href="/posts/new">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} isOwner={post.authorId === user.id} />
            ))}
          </div>
        )}

        {posts.length > 0 && <Pagination {...pagination} />}
      </main>
    </div>
  )
}
