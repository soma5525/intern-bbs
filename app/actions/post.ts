"use server";

import prisma from "@/lib/prisma";

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
