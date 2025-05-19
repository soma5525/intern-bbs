import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/protected/posts");
  }
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-4xl font-bold">ようこそ掲示板へ</h1>
          <p className="mt-4">
            この掲示板は、ユーザーが投稿を作成、編集、削除できるようになっています。
          </p>
          <div className="mt-6 flex gap-10">
            <Button asChild variant="outline">
              <Link href="/sign-in">ログイン</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">新規登録</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
