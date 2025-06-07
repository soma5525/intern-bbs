/**
 * 🎯 Server Actions統合テスト学習ガイド
 *
 * このファイルは投稿機能（Post）のサーバーアクションテストを
 * 段階的に学習するための練習用テンプレートです。
 *
 * 📚 学習目標:
 * - Server Actionsのテスト方法を理解する
 * - モック（jest.mock）の使い方を習得する
 * - FormDataを使ったテストの書き方を学ぶ
 * - 正常系・異常系・権限チェックのテスト技法を身につける
 *
 * 🔧 必要な知識:
 * - Jest基本機能（describe, it, expect）
 * - 非同期処理（async/await）
 * - Next.js Server Actions の概念
 */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPost, deletePost, getPost, getPosts, updatePost } from "../post";

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
      count: jest.fn(),
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

describe("📝 Post Actions 統合テスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("🔹 createPost（投稿作成）", () => {
    it("✅ レベル2: 正常に投稿を作成できる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      (mockPrisma.post.create as jest.Mock).mockResolvedValue({
        id: "post1",
        title: "test title",
        content: "test content",
        authorId: "user1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      });
      const formData = new FormData();
      formData.append("title", "test title");
      formData.append("content", "test content");
      const result = await createPost(formData);
      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: {
          title: "test title",
          content: "test content",
          authorId: "user1",
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/protected/posts");
      expect(result).toEqual({ success: true });
    });

    it("❌ レベル3: タイトルが空の場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      const formData = new FormData();
      formData.append("title", "");
      formData.append("content", "test content");
      const result = await createPost(formData);
      expect(result).toEqual({
        error: "タイトルは必須で、150文字以内である必要があります",
      });
      expect(mockPrisma.post.create).not.toHaveBeenCalledWith();
    });

    it("❌ レベル3: タイトルが150文字を超える場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      const formData = new FormData();
      formData.append("title", "a".repeat(151));
      formData.append("content", "test content");
      const result = await createPost(formData);
      expect(result).toEqual({
        error: "タイトルは必須で、150文字以内である必要があります",
      });
      expect(mockPrisma.post.create).not.toHaveBeenCalled();
    });

    it("❌ レベル3: 内容が空の場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      const formData = new FormData();
      formData.append("title", "test title");
      formData.append("content", "");
      const result = await createPost(formData);
      expect(result).toEqual({
        error: "内容は必須です",
      });
      expect(mockPrisma.post.create).not.toHaveBeenCalled();
    });

    it("💥 レベル5: データベースエラーが発生した場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      (mockPrisma.post.create as jest.Mock).mockRejectedValue(new Error());
      const formData = new FormData();
      formData.append("title", "test title");
      formData.append("content", "test content");
      const result = await createPost(formData);
      expect(result).toEqual({ error: "投稿に失敗しました" });
      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: {
          title: "test title",
          content: "test content",
          authorId: "user1",
        },
      });
    });
  });

  describe("🔸 updatePost（投稿更新）", () => {
    it("✅ レベル4: 正常に投稿を更新できる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: "post1",
        title: "test title",
        content: "test content",
        authorId: "user1",
        createdAt: new Date(),
      });

      (mockPrisma.post.update as jest.Mock).mockResolvedValue({
        id: "post1",
        title: "updated title",
        content: "updated content",
        authorId: "user1",
        createdAt: new Date(),
      });
      const formData = new FormData();
      formData.append("id", "post1");
      formData.append("title", "updated title");
      formData.append("content", "updated content");
      const result = await updatePost(formData);
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: "post1" },
        data: {
          title: "updated title",
          content: "updated content",
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/protected/posts");
      expect(result).toEqual({ success: true });
    });

    it("❌ レベル4: 存在しない投稿の更新はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(null);
      const formData = new FormData();
      formData.append("id", "post1");
      formData.append("title", "updated title");
      formData.append("content", "updated content");
      const result = await updatePost(formData);
      expect(result).toEqual({
        error: "投稿が見つかりません",
      });
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("🚫 レベル4: 他人の投稿の更新はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: "post1",
        title: "test title",
        content: "test content",
        authorId: "user2",
        createdAt: new Date(),
      });
      const formData = new FormData();
      formData.append("id", "post1");
      formData.append("title", "updated title");
      formData.append("content", "updated content");
      const result = await updatePost(formData);
      expect(result).toEqual({
        error: "この投稿を編集する権限がありません",
      });
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });
  });

  describe("📋 getPosts（投稿一覧取得）", () => {
    it("✅ レベル6: 投稿一覧を正常に取得できる", async () => {
      const mockPosts = [
        {
          id: "post1",
          title: "test title",
          content: "test content",
          authorId: "user1",
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          parentId: null,
          author: { name: "user1" },
          _count: { replies: 2 },
        },
      ];
      (mockPrisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
      (mockPrisma.post.count as jest.Mock).mockResolvedValue(1);
      const result = await getPosts(1);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: {
          isDeleted: false,
          author: { isActive: true },
          parentId: null,
        },
        include: {
          author: { select: { name: true } },
          _count: { select: { replies: { where: { isDeleted: false } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
      expect(result.posts).toEqual(mockPosts);
      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });
  });

  describe("🔍 getPost（投稿詳細取得）", () => {
    it("✅ レベル6: 投稿を正常に取得できる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      const mockPost = {
        id: "post1",
        title: "test title",
        content: "test content",
        authorId: "user2",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      const result = await getPost("post1");
      expect(result.post).toEqual(mockPost);
      expect(result.isOwner).toBe(false);
    });

    it("❌ レベル6: 存在しない投稿の取得はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await getPost("post1");
      expect(result).toEqual({ error: "投稿が見つかりません" });
    });
  });

  describe("🗑️ deletePost（投稿削除）", () => {
    it("✅ レベル6: 正常に投稿を削除できる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      const mockPost = {
        id: "post1",
        title: "test title",
        content: "test content",
        authorId: "user1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (mockPrisma.post.update as jest.Mock).mockResolvedValue({
        id: "post1",
        title: "test title",
        content: "test content",
        authorId: "user1",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: true,
      });
      const result = await deletePost("post1");
      expect(result).toEqual({ success: true });
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: "post1" },
        data: { isDeleted: true },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/protected/posts");
    });

    it("❌ レベル6: 存在しない投稿の削除はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await deletePost("post1");
      expect(result).toEqual({ error: "投稿が見つかりません" });
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("🚫 レベル6: 他人の投稿の削除はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: "post1",
        title: "test title",
        content: "test content",
        authorId: "user2",
        createdAt: new Date(),
      });
      const result = await deletePost("post1");
      expect(result).toEqual({ error: "この投稿を削除する権限がありません" });
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });
  });
});

/*
🎓 学習ポイント まとめ

✅ レベル1 完了後に理解できること:
- Jest でのモック設定方法
- TypeScript での型安全なモック作成
- beforeEach でのセットアップ

✅ レベル2 完了後に理解できること:
- Server Actions の基本的なテスト方法
- FormData を使ったテストデータ作成
- 非同期処理のテスト

✅ レベル3 完了後に理解できること:
- バリデーションロジックのテスト
- エラーケースの検証方法
- エッジケースの考え方

✅ レベル4 完了後に理解できること:
- CRUD操作のテスト
- 権限チェックのテスト方法
- 存在チェックのテスト

✅ レベル5 完了後に理解できること:
- 例外処理のテスト
- エラーハンドリングの検証
- 外部依存エラーのシミュレート

✅ レベル6 完了後に理解できること:
- 複雑なデータ構造のテスト
- ページネーションのテスト
- 統合的なテストの書き方

🔧 よく使うJestのマッチャー:
- expect(actual).toEqual(expected) - オブジェクトの深い比較
- expect(mock).toHaveBeenCalledWith(args) - 関数の呼び出し検証
- expect(mock).not.toHaveBeenCalled() - 関数が呼ばれていないことを検証
- expect(value).toBe(expected) - プリミティブ値の厳密比較

💡 テスト作成のコツ:
1. AAA パターン（Arrange, Act, Assert）を意識する
2. テスト名で期待される動作を明確にする
3. 一つのテストで一つの機能に集中する
4. モックは最小限にして、実際の動作に近づける
5. エラーケースも忘れずにテストする

🚀 次のステップ:
- auth.test.tsx での認証系テスト
- reply.test.tsx での返信機能テスト
- user.test.tsx でのユーザー管理テスト
- 統合テストから E2E テストへの発展
*/
