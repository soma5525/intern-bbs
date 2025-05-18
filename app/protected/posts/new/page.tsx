import { Metadata } from "next";
import { Header } from "@/components/header";
import { PostForm } from "@/components/post-form";
import { createPost } from "@/app/actions/post";

export const metadata: Metadata = {
  title: "新規投稿 - 掲示板",
  description: "新しい投稿を作成",
};

export default function CreatePostPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <PostForm type="create" action={createPost} />
      </main>
    </div>
  );
}
