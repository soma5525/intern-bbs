import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getPosts } from "@/app/actions/post";
import { redirect } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";

export const metadata: Metadata = {
  title: "Posts - Bulletin Board",
  description: "View all posts",
};

export default async function PostsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const pageParam = await searchParams.page;
  const page = pageParam ? Number.parseInt(pageParam.toString()) : 1;
  const { posts, pagination } = await getPosts(page);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">投稿一覧</h1>
          <Button asChild>
            <Link href="posts/new">
              <Plus className="h-4 w-4 mr-2" />
              新規投稿
            </Link>
          </Button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              投稿がありません。投稿を作成してください。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isOwner={post.authorId === user.id}
              />
            ))}
          </div>
        )}

        {posts.length > 0 && <Pagination {...pagination} />}
      </main>
    </div>
  );
}
