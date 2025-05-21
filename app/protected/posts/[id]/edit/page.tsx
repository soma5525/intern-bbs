import { getPost } from "@/app/actions/post";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { PostForm } from "@/components/post-form";
import { updatePost } from "@/app/actions/post";

export const metadata: Metadata = {
  title: "投稿編集 - 掲示板",
  description: "投稿を編集",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { post, isOwner } = await getPost(id);

  if (!isOwner) {
    redirect("/posts");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <PostForm
          type="edit"
          action={updatePost}
          initialData={{
            id: post.id,
            title: post.title,
            content: post.content,
          }}
        />
      </main>
    </div>
  );
}
