import type { NextRequest } from "next/server";
import { deletePost } from "@/app/actions/post";
import { NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deletePost(id);

    if (result && result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (result && result.success) {
      const redirectUrl = new URL("/protected/posts", request.url);
      return NextResponse.redirect(redirectUrl.toString());
    }

    return new Response(
      JSON.stringify({ error: "予期しないエラーが発生しました。" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "投稿の削除処理中にサーバーエラーが発生しました。",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
