"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ReplyFormProps {
  parentId: string;
  action: (
    parentId: string,
    formData: FormData
  ) => Promise<{ error?: string } | { success?: boolean } | undefined>;
  type?: "create" | "edit";
  initialData?: {
    id: string;
    content: string;
  };
}

export function ReplyForm({
  parentId,
  action,
  type = "create",
  initialData,
}: ReplyFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState(initialData?.content || "");

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await action(parentId, formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
      } else if (type === "create") {
        setContent("");
        // 成功時にページをリロードして最新の返信を表示
        window.location.reload();
      } else if (type === "edit" && result && "success" in result) {
        // 編集の場合は親投稿のページにリダイレクト
        window.location.href = `/protected/posts/${parentId}`;
      }
    } catch (err) {
      setError("予期せぬエラーが発生しました");
    } finally {
      // 必ずisLoadingをfalseにリセット
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{type === "create" ? "返信を投稿" : "返信を編集"}</CardTitle>
        <CardDescription>
          {type === "create"
            ? "この投稿に返信してください"
            : "返信内容を編集してください"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {initialData?.id && (
            <input type="hidden" name="id" value={initialData.id} />
          )}
          <div className="space-y-2">
            <Label htmlFor="content">返信内容</Label>
            <Textarea
              id="content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="返信内容を入力してください..."
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end space-x-2">
            {type === "edit" && (
              <Button variant="outline" asChild>
                <Link href={`/protected/posts/${parentId}`}>キャンセル</Link>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setContent(initialData?.content || "");
                setError(null);
              }}
              disabled={isLoading}
            >
              クリア
            </Button>
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading
                ? type === "create"
                  ? "投稿中..."
                  : "更新中..."
                : type === "create"
                  ? "返信する"
                  : "更新する"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
