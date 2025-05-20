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

  try {
    await prisma.post.create({
      data: {
        title,
        content,
        authorId: user?.id as string,
      },
    });
    revalidatePath("/protected/posts");
    // redirect("/protected/posts"); // リダイレクトはクライアントサイドで行う必要がある
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "投稿に失敗しました" };
  }
}

export async function updatePost(formData: FormData) {
  const user = await getCurrentUser();
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || title.length > 150) {
    return { error: "タイトルは必須で、150文字以内である必要があります。" };
  }

  if (!content) {
    return {
      error: "内容は必須です。",
    };
  }

  const post = await prisma.post.findUnique({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!post) {
    return { error: "投稿が見つかりません。" };
  }

  if (post.authorId !== user?.id) {
    return { error: "この投稿を編集する権限がありません。" };
  }

  await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
    },
  });

  revalidatePath("/protected/posts");
  // redirect("/protected/posts"); // ここも上記のcreatePostと同様
  return { success: true };
}

export async function getPosts(page = 1) {
  const postsPerPage = 10;
  const skip = (page - 1) * postsPerPage;

  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      author: {
        isActive: true,
      },
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
      author: {
        isActive: true,
      },
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

export async function getPost(id: string) {
  const user = await getCurrentUser();

  const post = await prisma.post.findUnique({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!post) {
    return { error: "投稿が見つかりません" };
  }

  const isOwner = post.authorId === user?.id;

  return {
    post,
    isOwner,
  };
}

export async function deletePost(id: string) {
  const user = await getCurrentUser();

  const post = await prisma.post.findUnique({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!post) {
    return { error: "投稿が見つかりません。" };
  }

  if (post.authorId !== user?.id) {
    return { error: "この投稿を削除する権限がありません。" };
  }

  await prisma.post.update({
    where: { id },
    data: {
      isDeleted: true,
    },
  });

  revalidatePath("/protected/posts");
  redirect("/protected/posts");
}
