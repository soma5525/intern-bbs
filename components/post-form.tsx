"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

interface PostFormProps {
  type: "create" | "edit";
  action: (
    formData: FormData
  ) => Promise<{ error?: string } | { success: true } | undefined>;
  initialData?: {
    id: string;
    title: string;
    content: string;
  };
}

// フォーム送信ボタンコンポーネント（useFormStatusを使用）
function SubmitButton({ type }: { type: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "投稿中..." : type === "create" ? "投稿" : "更新"}
    </Button>
  );
}

export function PostForm({ type, action, initialData }: PostFormProps) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);

    try {
      const result = await action(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      } else if (result && "success" in result) {
        router.push("/protected/posts");
      } else {
        setError("投稿処理に失敗しました。");
      }
    } catch (err) {
      setError("予期しないエラーが発生しました");
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{type === "create" ? "新規投稿" : "編集"}</CardTitle>
        <CardDescription>
          {type === "create" ? "新しい投稿を作成" : "投稿を編集"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {initialData?.id && (
            <input type="hidden" name="id" value={initialData.id} />
          )}
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initialData?.title || ""}
              maxLength={150}
              required
            />
            <p className="text-xs text-muted-foreground">最大150文字</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              name="content"
              defaultValue={initialData?.content || ""}
              rows={10}
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/protected/posts">キャンセル</Link>
            </Button>
            <SubmitButton type={type} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
