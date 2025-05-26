import { createReply, getPostWithReplies } from "@/app/actions/reply";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/header";
import { PostCard } from "@/components/post-card";
import { Separator } from "@/components/ui/separator";
import { ReplyForm } from "@/components/reply-form";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const result = await getPostWithReplies(params.id);

  if (!result) {
    return {
      title: "投稿が見つかりません - 掲示板",
    };
  }

  if (!result.post) {
    return {
      title: "投稿が見つかりません - 掲示板",
    };
  }

  return {
    title: `${result.post.title || "投稿詳細"} - 掲示板`,
    description: result.post.content.substring(0, 160),
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const result = await getPostWithReplies(params.id);

  if (!result) {
    notFound();
  }

  const { post, replies } = result;

  if (!post || !replies) {
    notFound();
  }

  const isOwner = post.authorId === user.id;

  async function handleCreateReply(parentId: string, formData: FormData) {
    "use server";
    return await createReply(parentId, formData);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <PostCard post={post} isOwner={isOwner} showActions={true} />
        </div>

        <Separator className="my-6" />

        <div className="mb-6">
          <ReplyForm parentId={post.id} action={handleCreateReply} />
        </div>

        <Separator className="my-6" />

        {/* 返信一覧 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">返信 ({replies.length}件)</h2>

          {replies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                まだ返信がありません。最初の返信を投稿しましょう！
              </p>
            </div>
          ) : (
            <>
              {replies.map((reply) => (
                <PostCard
                  key={reply.id}
                  post={{
                    ...reply,
                    parentId: post.id,
                    parent: { id: post.id, title: post.title },
                  }}
                  isOwner={reply.authorId === user.id}
                  showActions={true}
                />
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
