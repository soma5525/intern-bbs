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

interface ReplyFormProps {
  parentId: string;
  action: (
    parentId: string,
    formData: FormData
  ) => Promise<{ error?: string } | undefined>;
}

export function ReplyForm({ parentId, action }: ReplyFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState("");

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await action(parentId, formData);
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        setContent("");
      }
    } catch (err) {
      setError("予期せぬエラーが発生しました");
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>返信を投稿</CardTitle>
        <CardDescription>この投稿に返信してください</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
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
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setContent("");
                setError(null);
              }}
              disabled={isLoading}
            >
              クリア
            </Button>
            <Button type="submit" disabled={isLoading || !content.trim()}>
              {isLoading ? "投稿中..." : "返信する"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
