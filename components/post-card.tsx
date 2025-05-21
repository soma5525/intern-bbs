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

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    author: {
      name: string;
    };
  };
  isOwner: boolean;
}

export function PostCard({ post, isOwner }: PostCardProps) {
  const contentPreview =
    post.content.length > 150
      ? // 投稿の内容が長い場合、最初の150文字のみを表示し、末尾に「...」を追加
        `${post.content.substring(0, 150)}...`
      : post.content;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground">
          {post.author?.name || "匿名ユーザー"}
        </div>
        <CardTitle className="text-xl">{post.title}</CardTitle>
        <CardDescription>
          {formatDistanceToNow(new Date(post.createdAt), {
            addSuffix: true,
          })}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="whitespace-pre-line">{contentPreview}</p>
      </CardContent>
      {isOwner && (
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/protected/posts/${post.id}/edit`}>編集</Link>
          </Button>
          <form action={`/protected/posts/${post.id}/delete`} method="post">
            <input type="hidden" name="id" value={post.id} />
            <Button variant="destructive" size="sm" type="submit">
              削除
            </Button>
          </form>
        </CardFooter>
      )}
    </Card>
  );
}
