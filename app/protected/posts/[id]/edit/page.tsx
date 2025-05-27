import { getPost } from "@/app/actions/post";
import { updateReply } from "@/app/actions/reply";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { PostForm } from "@/components/post-form";
import { ReplyForm } from "@/components/reply-form";
import { updatePost } from "@/app/actions/post";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "編集 - 掲示板",
  description: "投稿または返信を編集",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 投稿データを取得（返信かどうかも判定）
  const post = await prisma.post.findUnique({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });

  if (!post) {
    redirect("/protected/posts");
  }

  const isOwner = post.authorId === user.id;
  if (!isOwner) {
    redirect("/protected/posts");
  }

  // 返信の場合
  if (post.parentId) {
    const handleUpdateReply = async (parentId: string, formData: FormData) => {
      "use server";
      return await updateReply(formData);
    };

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <ReplyForm
            parentId={post.parentId}
            action={handleUpdateReply}
            type="edit"
            initialData={{
              id: post.id,
              content: post.content,
            }}
          />
        </main>
      </div>
    );
  }

  // 通常の投稿の場合
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
