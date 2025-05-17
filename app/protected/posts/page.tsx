import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

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
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1;
  // const { posts, pagination } = await getPosts(page);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Posts</h1>
          <Button asChild>
            <Link href="posts/new">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
