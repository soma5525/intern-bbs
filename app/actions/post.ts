"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const user = await getCurrentUser();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!user) {
    return { error: "ユーザーが見つかりません" };
  }
  if (user.isActive === false) {
    return { error: "アカウントが無効です" };
  }

  if (!title || title.length > 150) {
    return { error: "タイトルは必須で、150文字以内である必要があります" };
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
    return { success: true };
  } catch (error) {
    return { error: "投稿に失敗しました" };
  }
}

export async function updatePost(formData: FormData) {
  const user = await getCurrentUser();
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!user) {
    return { error: "ユーザーが見つかりません" };
  }
  if (user.isActive === false) {
    return { error: "アカウントが無効です" };
  }

  if (!title || title.length > 150) {
    return { error: "タイトルは必須で、150文字以内である必要があります" };
  }

  if (!content) {
    return {
      error: "内容は必須です",
    };
  }

  const post = await prisma.post.findUnique({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!post) {
    return { error: "投稿が見つかりません" };
  }

  if (post.authorId !== user?.id) {
    return { error: "この投稿を編集する権限がありません" };
  }

  await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
    },
  });

  revalidatePath("/protected/posts");
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
      parentId: null, // 親投稿のみ取得する
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          replies: {
            where: {
              isDeleted: false,
              author: {
                isActive: true,
              },
            },
          },
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
      parentId: null,
    },
  });

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
  if (!user) {
    return { error: "ユーザーが見つかりません" };
  }
  if (user.isActive === false) {
    return { error: "アカウントが無効です" };
  }

  const post = await prisma.post.findUnique({
    where: {
      id,
      isDeleted: false,
      author: {
        isActive: true,
      },
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
  if (!user) {
    return { error: "ユーザーが見つかりません" };
  }
  if (user.isActive === false) {
    return { error: "アカウントが無効です" };
  }

  const post = await prisma.post.findUnique({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!post) {
    return { error: "投稿が見つかりません" };
  }

  if (post.authorId !== user?.id) {
    return { error: "この投稿を削除する権限がありません" };
  }

  try {
    await prisma.post.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });

    revalidatePath("/protected/posts");
    return { success: true };
  } catch (dbError) {
    return { error: "投稿の削除中にデータベースエラーが発生しました" };
  }
}
