/**
 * 🎯 Reply Actions統合テスト
 *
 * このファイルは返信機能（Reply）のサーバーアクションテストです。
 *
 * 📚 テスト対象:
 * - createReply: 返信作成機能
 * - getPostWithReplies: 投稿と返信取得機能
 * - updateReply: 返信更新機能
 */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReply, getPostWithReplies, updateReply } from "../reply";

jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

describe("📝 Reply Actions 統合テスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("🔹 createReply（返信作成）", () => {
    it("正常に返信を作成できる", async () => {
      // モックユーザーを設定
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      // 親投稿のモック設定
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: "parent-post-1",
        title: "親投稿",
        content: "親投稿の内容",
        authorId: "user2",
        isDeleted: false,
      });

      // 返信作成のモック設定
      (mockPrisma.post.create as jest.Mock).mockResolvedValue({
        id: "reply-1",
        title: "",
        content: "返信内容",
        authorId: "user1",
        parentId: "parent-post-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      });

      // FormDataを作成
      const formData = new FormData();
      formData.append("content", "返信内容");

      // 関数実行
      const result = await createReply("parent-post-1", formData);

      // 検証
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: {
          id: "parent-post-1",
          isDeleted: false,
        },
      });
      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: {
          title: "",
          content: "返信内容",
          authorId: "user1",
          parentId: "parent-post-1",
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/protected/posts/parent-post-1"
      );
    });

    it("ユーザーが見つからない場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const formData = new FormData();
      formData.append("content", "返信内容");

      const result = await createReply("parent-post-1", formData);

      expect(result).toEqual({
        error: "ユーザーが見つかりません",
      });
      expect(mockPrisma.post.create).not.toHaveBeenCalled();
    });

    it("返信内容が空の場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const formData = new FormData();
      formData.append("content", "");

      const result = await createReply("parent-post-1", formData);

      expect(result).toEqual({
        error: "返信内容は必須です",
      });
      expect(mockPrisma.post.create).not.toHaveBeenCalled();
    });

    it("返信先の投稿が見つからない場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("content", "返信内容");

      const result = await createReply("nonexistent-post", formData);

      expect(result).toEqual({
        error: "返信先の投稿が見つかりません",
      });
      expect(mockPrisma.post.create).not.toHaveBeenCalled();
    });

    it("データベースエラーが発生した場合はエラーを投げる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: "parent-post-1",
        title: "親投稿",
        content: "親投稿の内容",
        authorId: "user2",
        isDeleted: false,
      });

      (mockPrisma.post.create as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const formData = new FormData();
      formData.append("content", "返信内容");

      await expect(createReply("parent-post-1", formData)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("📋 getPostWithReplies（投稿と返信取得）", () => {
    it(" 正常に投稿と返信を取得できる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const mockPost = {
        id: "post-1",
        title: "投稿タイトル",
        content: "投稿内容",
        authorId: "user2",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        author: {
          id: "user2",
          name: "投稿者",
        },
      };

      const mockReplies = [
        {
          id: "reply-1",
          title: "",
          content: "返信1",
          authorId: "user1",
          parentId: "post-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          author: {
            id: "user1",
            name: "返信者1",
          },
        },
        {
          id: "reply-2",
          title: "",
          content: "返信2",
          authorId: "user3",
          parentId: "post-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          author: {
            id: "user3",
            name: "返信者2",
          },
        },
      ];

      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (mockPrisma.post.findMany as jest.Mock).mockResolvedValue(mockReplies);

      const result = await getPostWithReplies("post-1");

      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: "post-1", isDeleted: false },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: {
          parentId: "post-1",
          isDeleted: false,
          author: { isActive: true },
        },
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

      expect(result).toEqual({
        post: mockPost,
        replies: mockReplies,
      });
    });

    it("退会済みユーザーの返信は表示されない", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const mockPost = {
        id: "post-1",
        title: "投稿タイトル",
        content: "投稿内容",
        authorId: "user2",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        author: {
          id: "user2",
          name: "投稿者",
        },
      };

      // アクティブなユーザーの返信のみを含む配列を返す
      const mockReplies = [
        {
          id: "reply-1",
          title: "",
          content: "アクティブなユーザーの返信",
          authorId: "user1",
          parentId: "post-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          author: {
            id: "user1",
            name: "アクティブなユーザー",
          },
        },
      ];

      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (mockPrisma.post.findMany as jest.Mock).mockResolvedValue(mockReplies);

      const result = await getPostWithReplies("post-1");

      // findManyクエリのwhere句に退会済みユーザーの返信を除外する条件があることを確認
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            author: { isActive: true },
          }),
        })
      );

      // 返信一覧に退会済みユーザーの返信が含まれていないことを確認
      expect(result).toHaveProperty("replies");
      expect(result.replies).toHaveLength(1);
      expect(result.replies?.[0]?.authorId).toBe("user1");
    });

    it("ユーザーが見つからない場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await getPostWithReplies("post-1");

      expect(result).toEqual({
        error: "ユーザーが見つかりません",
      });
      expect(mockPrisma.post.findUnique).not.toHaveBeenCalled();
    });

    it("投稿が見つからない場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getPostWithReplies("nonexistent-post");

      expect(result).toEqual({
        error: "投稿が見つかりません",
      });
      expect(mockPrisma.post.findMany).not.toHaveBeenCalled();
    });
  });

  describe("🔸 updateReply（返信更新）", () => {
    it(" 正常に返信を更新できる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const mockReply = {
        id: "reply-1",
        title: "",
        content: "元の返信内容",
        authorId: "user1",
        parentId: "parent-post-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };

      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(mockReply);
      (mockPrisma.post.update as jest.Mock).mockResolvedValue({
        ...mockReply,
        content: "更新された返信内容",
      });

      const formData = new FormData();
      formData.append("id", "reply-1");
      formData.append("content", "更新された返信内容");

      const result = await updateReply(formData);

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: "reply-1" },
        data: {
          content: "更新された返信内容",
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/protected/posts/parent-post-1"
      );
      expect(result).toEqual({ success: true });
    });

    it("ユーザーが見つからない場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const formData = new FormData();
      formData.append("id", "reply-1");
      formData.append("content", "更新された返信内容");

      const result = await updateReply(formData);

      expect(result).toEqual({
        error: "ユーザーが見つかりません",
      });
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("返信内容が空の場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const formData = new FormData();
      formData.append("id", "reply-1");
      formData.append("content", "");

      const result = await updateReply(formData);

      expect(result).toEqual({
        error: "返信内容は必須です",
      });
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("返信が見つからない場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("id", "nonexistent-reply");
      formData.append("content", "更新された返信内容");

      const result = await updateReply(formData);

      expect(result).toEqual({
        error: "返信が見つかりません",
      });
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("他人の返信を編集しようとした場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const mockReply = {
        id: "reply-1",
        title: "",
        content: "他人の返信内容",
        authorId: "user2", // 異なるユーザー
        parentId: "parent-post-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };

      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(mockReply);

      const formData = new FormData();
      formData.append("id", "reply-1");
      formData.append("content", "更新された返信内容");

      const result = await updateReply(formData);

      expect(result).toEqual({
        error: "この返信を編集する権限がありません",
      });
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("返信ではない投稿を編集しようとした場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const mockPost = {
        id: "post-1",
        title: "通常の投稿",
        content: "投稿内容",
        authorId: "user1",
        parentId: null, // 親投稿なし（返信ではない）
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };

      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      const formData = new FormData();
      formData.append("id", "post-1");
      formData.append("content", "更新された内容");

      const result = await updateReply(formData);

      expect(result).toEqual({
        error: "この投稿は返信ではありません",
      });
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("データベースエラーが発生した場合はエラーを投げる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const mockReply = {
        id: "reply-1",
        title: "",
        content: "元の返信内容",
        authorId: "user1",
        parentId: "parent-post-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };

      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(mockReply);
      (mockPrisma.post.update as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const formData = new FormData();
      formData.append("id", "reply-1");
      formData.append("content", "更新された返信内容");

      await expect(updateReply(formData)).rejects.toThrow("Database error");
    });
  });
});

/*
🎓 Reply Actions テスト まとめ

 createReply のテストケース:
- 正常な返信作成
- ユーザー認証エラー
- バリデーションエラー（空の内容）
- 親投稿が存在しない
- データベースエラー

 getPostWithReplies のテストケース:
- 正常な投稿と返信の取得
- 退会済みユーザーの返信は表示されないことを確認
- ユーザー認証エラー
- 投稿が存在しない

 updateReply のテストケース:
- 正常な返信更新
- ユーザー認証エラー
- バリデーションエラー（空の内容）
- 返信が存在しない
- 権限エラー（他人の返信）
- ビジネスロジックエラー（返信ではない投稿）
- データベースエラー

🔧 モック戦略:
- getCurrentUser: ユーザー認証のモック
- prisma.post: データベース操作のモック
- revalidatePath: キャッシュ無効化のモック

💡 テストの特徴:
- 権限チェックの詳細なテスト
- 親子関係（投稿-返信）の検証
- エラーハンドリングの網羅的なカバレッジ
*/
