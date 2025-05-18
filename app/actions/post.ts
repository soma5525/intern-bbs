"use server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const user = await getCurrentUser();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || title.length > 150) {
    return { error: "タイトルは必須で、150文字以内である必要があります。" };
  }

  if (!content) {
    return { error: "内容は必須です" };
  }

  await prisma.post.create({
    data: {
      title,
      content,
      authorId: user?.id as string,
    },
  });

  revalidatePath("/protected/posts");
  redirect("/protected/posts");
}

export async function getPosts(page = 1) {
  const postsPerPage = 10;
  const skip = (page - 1) * postsPerPage;

  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: postsPerPage,
  });

  const totalPosts = await prisma.post.count({
    where: {
      isDeleted: false,
    },
  });

  // paginationのためのデータを作成
  // 現在のページ、総ページ数、次のページがあるかどうか、前のページがあるかどうか
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  return {
    posts,
    pagination: {
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
