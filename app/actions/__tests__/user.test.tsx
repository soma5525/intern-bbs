/**
 * 🎯 User Actions統合テスト
 *
 * このファイルはユーザープロフィール管理機能のサーバーアクションテストです。
 *
 * 📚 テスト対象:
 * - saveProfileData: プロフィールデータ保存機能
 * - updateUserProfile: プロフィール更新機能
 * - deactivateAccount: アカウント無効化機能
 * - getProfileData: プロフィールデータ取得機能
 */

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  saveProfileData,
  updateUserProfile,
  deactivateAccount,
  getProfileData,
} from "../user";

jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    userProfile: {
      update: jest.fn(),
    },
  },
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockCookies = cookies as jest.MockedFunction<typeof cookies>;

describe("📝 User Actions 統合テスト", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("🔹 saveProfileData（プロフィールデータ保存）", () => {
    it("✅ 正常にプロフィールデータを保存できる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const mockCookieStore = {
        set: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const formData = new FormData();
      formData.append("name", "Updated User");
      formData.append("email", "updated@example.com");

      await saveProfileData(formData);

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "profileData",
        JSON.stringify({
          name: "Updated User",
          email: "updated@example.com",
          userId: "user1",
        }),
        expect.objectContaining({
          maxAge: 60 * 10,
          path: "/",
          httpOnly: true,
        })
      );
      expect(mockRedirect).toHaveBeenCalledWith("/protected/profile/confirm");
    });

    it("❌ ユーザーが見つからない場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const formData = new FormData();
      formData.append("name", "Updated User");
      formData.append("email", "updated@example.com");

      const result = await saveProfileData(formData);

      expect(result).toEqual({
        error: "ユーザーが見つかりません",
      });
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("❌ 名前が未入力の場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const formData = new FormData();
      formData.append("name", "");
      formData.append("email", "updated@example.com");

      const result = await saveProfileData(formData);

      expect(result).toEqual({
        error: "名前は必須です",
      });
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("❌ メールアドレスが未入力の場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const formData = new FormData();
      formData.append("name", "Updated User");
      formData.append("email", "");

      const result = await saveProfileData(formData);

      expect(result).toEqual({
        error: "メールアドレスは必須です",
      });
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("🔸 updateUserProfile（プロフィール更新）", () => {
    beforeEach(() => {
      // getProfileDataのモック設定
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({
          value: JSON.stringify({
            name: "Updated User",
            email: "updated@example.com",
            userId: "user1",
          }),
        }),
        delete: jest.fn(),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);
    });

    it("✅ 正常にプロフィールを更新できる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const mockSupabase = {
        auth: {
          updateUser: jest.fn().mockResolvedValue({
            error: null,
            data: { user: { id: "user1" } },
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      (mockPrisma.userProfile.update as jest.Mock).mockResolvedValue({
        id: "user1",
        name: "Updated User",
        email: "updated@example.com",
        isActive: true,
      });

      const formData = new FormData();
      const result = await updateUserProfile(formData);

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        email: "updated@example.com",
        data: { full_name: "Updated User" },
      });
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: {
          name: "Updated User",
          email: "updated@example.com",
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/protected/profile/edit"
      );
      expect(result).toEqual({ success: true });
    });

    it("❌ ユーザーが見つからない場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const formData = new FormData();
      const result = await updateUserProfile(formData);

      expect(result).toEqual({
        error: "ユーザーが見つかりません",
      });
      expect(mockPrisma.userProfile.update).not.toHaveBeenCalled();
    });

    it("❌ Supabase認証更新エラーが発生した場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const mockSupabase = {
        auth: {
          updateUser: jest.fn().mockResolvedValue({
            error: { message: "Email already exists" },
            data: null,
          }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const formData = new FormData();
      const result = await updateUserProfile(formData);

      expect(result).toEqual({
        error: "Email already exists",
      });
      expect(mockPrisma.userProfile.update).not.toHaveBeenCalled();
    });

    it("❌ データベース更新エラーが発生した場合はロールバックしてエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const mockSupabase = {
        auth: {
          updateUser: jest
            .fn()
            .mockResolvedValueOnce({
              error: null,
              data: { user: { id: "user1" } },
            })
            .mockResolvedValueOnce({
              error: null,
              data: { user: { id: "user1" } },
            }),
        },
      };
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      (mockPrisma.userProfile.update as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const formData = new FormData();
      const result = await updateUserProfile(formData);

      // ロールバックが実行されることを確認
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledTimes(2);
      expect(mockSupabase.auth.updateUser).toHaveBeenLastCalledWith({
        email: "test@example.com",
      });
      expect(result).toEqual({
        error: "データベース更新に失敗しました",
      });
    });
  });

  describe("🗑️ deactivateAccount（アカウント無効化）", () => {
    it("✅ 正常にアカウントを無効化できる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      (mockPrisma.userProfile.update as jest.Mock).mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: false,
      });

      await deactivateAccount();

      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: {
          isActive: false,
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/protected/profile/edit"
      );
      expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
    });

    it("❌ ユーザーが見つからない場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await deactivateAccount();

      expect(result).toEqual({
        error: "ユーザーが見つかりません",
      });
      expect(mockPrisma.userProfile.update).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("💥 データベースエラーが発生した場合はエラーを投げる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      (mockPrisma.userProfile.update as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(deactivateAccount()).rejects.toThrow("Database error");
    });
  });

  describe("📋 getProfileData（プロフィールデータ取得）", () => {
    it("✅ 正常にプロフィールデータを取得できる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const profileData = {
        name: "Updated User",
        email: "updated@example.com",
        userId: "user1",
      };

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({
          value: JSON.stringify(profileData),
        }),
        delete: jest.fn(),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const result = await getProfileData();

      expect(result).toEqual(profileData);
    });

    it("❌ ユーザーが見つからない場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await getProfileData();

      expect(result).toEqual({
        error: "ユーザーが見つかりません",
      });
    });

    it("❌ Cookieが存在しない場合はエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const mockCookieStore = {
        get: jest.fn().mockReturnValue(null),
        delete: jest.fn(),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const result = await getProfileData();

      expect(result).toEqual({
        error: "プロフィールデータが見つかりません",
      });
    });

    it("❌ 異なるユーザーのCookieの場合はCookieを削除してエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const profileData = {
        name: "Other User",
        email: "other@example.com",
        userId: "user2", // 異なるユーザー
      };

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({
          value: JSON.stringify(profileData),
        }),
        delete: jest.fn(),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const result = await getProfileData();

      expect(mockCookieStore.delete).toHaveBeenCalledWith("profileData");
      expect(result).toEqual({
        error: "プロフィールデータが見つかりません",
      });
    });

    it("❌ JSONパースに失敗した場合はCookieを削除してエラーを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: "user1",
        name: "test user",
        email: "test@example.com",
        isActive: true,
      });

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({
          value: "invalid-json",
        }),
        delete: jest.fn(),
      };
      mockCookies.mockResolvedValue(mockCookieStore as any);

      const result = await getProfileData();

      expect(mockCookieStore.delete).toHaveBeenCalledWith("profileData");
      expect(result).toEqual({
        error: "プロフィールデータが見つかりません",
      });
    });
  });
});

/*
🎓 User Actions テスト まとめ

✅ saveProfileData のテストケース:
- 正常なプロフィールデータ保存とリダイレクト
- ユーザー認証エラー
- バリデーションエラー（名前、メールアドレス）

✅ updateUserProfile のテストケース:
- 正常なプロフィール更新（Supabase + Prisma）
- ユーザー認証エラー
- Supabase認証更新エラー
- データベース更新エラー（ロールバック機能付き）

✅ deactivateAccount のテストケース:
- 正常なアカウント無効化
- ユーザー認証エラー
- データベースエラー

✅ getProfileData のテストケース:
- 正常なプロフィールデータ取得
- ユーザー認証エラー
- Cookie不存在エラー
- セキュリティチェック（異なるユーザーのCookie）
- JSONパースエラー

🔧 モック戦略:
- getCurrentUser: ユーザー認証のモック
- createClient: Supabaseクライアントのモック
- prisma.userProfile: データベース操作のモック
- cookies: Cookie操作のモック
- revalidatePath: キャッシュ無効化のモック
- redirect: リダイレクトのモック

💡 テストの特徴:
- 複雑な認証フローのテスト
- トランザクション的な処理（ロールバック）のテスト
- セキュリティ観点（ユーザーIDの検証）のテスト
- Cookie管理の詳細なテスト
*/
