import type { NextRequest } from "next/server";
import { deletePost } from "@/app/actions/post";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const formData = await request.formData();
  const id = formData.get("id") as string;

  return deletePost(id);
}
