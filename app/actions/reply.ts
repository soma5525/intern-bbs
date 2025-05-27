"use server";

import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";

export async function createReply(parentId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "ユーザーが見つかりません" };
  }

  const content = formData.get("content") as string;

  if (!content) {
    return { error: "返信内容は必須です" };
  }

  const parentPost = await prisma.post.findUnique({
    where: {
      id: parentId,
      isDeleted: false,
    },
  });

  if (!parentPost) {
    return { error: "返信先の投稿が見つかりません" };
  }

  await prisma.post.create({
    data: {
      title: "",
      content,
      authorId: user.id,
      parentId: parentId,
    },
  });

  revalidatePath(`/protected/posts/${parentId}`);
  // redirect(`/protected/posts/${parentId}`);
}

export async function getPostWithReplies(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "ユーザーが見つかりません" };
  }

  const post = await prisma.post.findUnique({
    where: { id, isDeleted: false },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });

  if (!post) {
    return { error: "投稿が見つかりません" };
  }

  const replies = await prisma.post.findMany({
    where: { parentId: id, isDeleted: false },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return { post, replies };
}

export async function updateReply(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "ユーザーが見つかりません" };
  }

  const id = formData.get("id") as string;
  const content = formData.get("content") as string;

  if (!content) {
    return { error: "返信内容は必須です" };
  }

  const reply = await prisma.post.findUnique({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!reply) {
    return { error: "返信が見つかりません" };
  }

  if (reply.authorId !== user.id) {
    return { error: "この返信を編集する権限がありません" };
  }

  if (!reply.parentId) {
    return { error: "この投稿は返信ではありません" };
  }

  await prisma.post.update({
    where: { id },
    data: {
      content,
    },
  });

  revalidatePath(`/protected/posts/${reply.parentId}`);
  return { success: true };
}
