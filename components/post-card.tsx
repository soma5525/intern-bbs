"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Button } from "./ui/button";
import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    author: {
      name: string;
    };
    _count?: {
      replies: number;
    };
    parentId?: string | null;
    parent?: {
      id: string;
      title: string;
    } | null;
  };
  isOwner: boolean;
  showActions?: boolean;
}

export function PostCard({ post, isOwner, showActions = true }: PostCardProps) {
  const [timeAgo, setTimeAgo] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTimeAgo(
      formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true,
      })
    );
  }, [post.createdAt]);

  const contentPreview =
    post.content.length > 150
      ? `${post.content.substring(0, 150)}...`
      : post.content;
  const replyCount = post._count?.replies || 0;
  const isReply = !!post.parentId;

  return (
    <Card
      className={`w-full ${isReply ? "ml-6 border-l-4 border-l-muted" : ""}`}
    >
      <CardHeader>
        {isReply && post.parent && (
          <div className="text-sm text-muted-foreground mb-2">
            <Link
              href={`/protected/posts/${post.parent.id}`}
              className="hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              返信先: {post.parent.title}
            </Link>
          </div>
        )}
        <CardTitle className="text-xl">
          {post.title || (isReply ? "返信" : "無題")}
        </CardTitle>
        <CardDescription>
          投稿者: {post.author.name} •{" "}
          {isClient ? timeAgo : new Date(post.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="whitespace-pre-line">{contentPreview}</p>
        {!isReply && replyCount > 0 && (
          <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span>{replyCount}件の返信</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          {!isReply && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/protected/posts/${post.id}`}>詳細を見る</Link>
            </Button>
          )}
        </div>
        {showActions && isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/protected/posts/${post.id}/edit`}>編集</Link>
            </Button>
            <form action={`/protected/posts/${post.id}/delete`} method="post">
              <input type="hidden" name="id" value={post.id} />
              <Button variant="destructive" size="sm" type="submit">
                削除
              </Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
