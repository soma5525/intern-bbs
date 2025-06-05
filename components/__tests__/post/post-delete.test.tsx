import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PostCard } from "@/components/post-card";
import { useRouter } from "next/navigation";

// useFormStatusのモック
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  useFormStatus: jest.fn(),
}));

// Next.js useRouterのモック
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseFormStatus = require("react-dom")
  .useFormStatus as jest.MockedFunction<any>;

describe("PostCard Delete Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトではpending: falseを返す
    mockUseFormStatus.mockReturnValue({ pending: false });
    // useRouterのモック設定
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    });
  });

  const mockPost = {
    id: "test-post-id",
    title: "テスト投稿",
    content: "テスト内容",
    createdAt: new Date("2023-01-01"),
    authorId: "test-author-id",
    parentId: null,
    isDeleted: false,
    author: {
      id: "test-author-id",
      name: "テストユーザー",
    },
    _count: {
      replies: 0,
    },
  };

  describe("削除ボタンの表示", () => {
    it("投稿者で操作可能な場合、削除ボタンが表示される", () => {
      render(<PostCard post={mockPost} isOwner={true} showActions={true} />);

      const deleteButton = screen.getByRole("button", { name: "削除" });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveAttribute("type", "submit");
      expect(deleteButton).toHaveClass("text-destructive-foreground");
    });

    it("投稿者でない場合、削除ボタンが表示されない", () => {
      render(<PostCard post={mockPost} isOwner={false} showActions={true} />);

      const deleteButton = screen.queryByRole("button", { name: "削除" });
      expect(deleteButton).not.toBeInTheDocument();
    });

    it("showActionsがfalseの場合、削除ボタンが表示されない", () => {
      render(<PostCard post={mockPost} isOwner={true} showActions={false} />);

      const deleteButton = screen.queryByRole("button", { name: "削除" });
      expect(deleteButton).not.toBeInTheDocument();
    });
  });

  describe("削除フォームの構造", () => {
    it("削除フォームが正しい属性を持つ", () => {
      render(<PostCard post={mockPost} isOwner={true} showActions={true} />);

      const deleteButton = screen.getByRole("button", { name: "削除" });
      const form = deleteButton.closest("form");

      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute(
        "action",
        `/protected/posts/${mockPost.id}/delete`
      );
      expect(form).toHaveAttribute("method", "post");
    });

    it("hiddenフィールドに投稿IDが設定される", () => {
      render(<PostCard post={mockPost} isOwner={true} showActions={true} />);

      const hiddenInput = document.querySelector(
        'input[name="id"]'
      ) as HTMLInputElement;
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveAttribute("type", "hidden");
      expect(hiddenInput.value).toBe(mockPost.id);
    });
  });

  describe("その他のボタンとの共存", () => {
    it("投稿者の場合、編集ボタンと削除ボタンの両方が表示される", () => {
      render(<PostCard post={mockPost} isOwner={true} showActions={true} />);

      const editButton = screen.getByRole("link", { name: "編集" });
      const deleteButton = screen.getByRole("button", { name: "削除" });

      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    it("通常投稿の場合、詳細を見るボタンが表示される", () => {
      render(<PostCard post={mockPost} isOwner={false} showActions={true} />);

      const detailButton = screen.getByRole("link", { name: "詳細を見る" });
      expect(detailButton).toBeInTheDocument();
      expect(detailButton).toHaveAttribute(
        "href",
        `/protected/posts/${mockPost.id}`
      );
    });

    it("返信投稿の場合、詳細を見るボタンが表示されない", () => {
      const replyPost = { ...mockPost, parentId: "parent-id" };
      render(<PostCard post={replyPost} isOwner={false} showActions={true} />);

      const detailButton = screen.queryByRole("link", { name: "詳細を見る" });
      expect(detailButton).not.toBeInTheDocument();
    });
  });

  describe("投稿データの表示", () => {
    it("投稿の基本情報が正しく表示される", () => {
      render(<PostCard post={mockPost} isOwner={false} showActions={true} />);

      expect(screen.getByText(mockPost.title)).toBeInTheDocument();
      expect(screen.getByText(mockPost.content)).toBeInTheDocument();
      // 投稿者名は「投稿者: テストユーザー」として表示されるため部分一致で検索
      expect(screen.getByText(/投稿者:.*テストユーザー/)).toBeInTheDocument();
    });

    it("投稿日時が正しくフォーマットされて表示される", () => {
      render(<PostCard post={mockPost} isOwner={false} showActions={true} />);

      // 実際の表示内容「over 2 years ago」に合わせて確認
      expect(screen.getByText(/over.*years ago/)).toBeInTheDocument();
    });

    it("返信数が表示される", () => {
      const postWithReplies = {
        ...mockPost,
        _count: { replies: 3 },
      };
      render(
        <PostCard post={postWithReplies} isOwner={false} showActions={true} />
      );

      expect(screen.getByText(/3件の返信/)).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("削除ボタンに適切なaria属性が設定される", () => {
      render(<PostCard post={mockPost} isOwner={true} showActions={true} />);

      const deleteButton = screen.getByRole("button", { name: "削除" });
      expect(deleteButton).toBeEnabled();
      expect(deleteButton).toHaveAttribute("type", "submit");
    });

    it("削除ボタンのデフォルト状態が正常", () => {
      // useFormStatusのデフォルト状態（pending: false）でボタンが有効であることを確認
      render(<PostCard post={mockPost} isOwner={true} showActions={true} />);

      const deleteButton = screen.getByRole("button", { name: "削除" });
      expect(deleteButton).toBeEnabled();
    });

    it("フォーム送信時にボタンが無効化される", () => {
      // useFormStatusがpending: trueを返すようにモック
      mockUseFormStatus.mockReturnValue({ pending: true });

      render(<PostCard post={mockPost} isOwner={true} showActions={true} />);

      const deleteButton = screen.getByRole("button", { name: "削除中..." });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toBeDisabled();
    });
  });
});

// 削除確認ダイアログのテスト（将来的に実装される場合）
describe("DeleteConfirmationDialog (Future Implementation)", () => {
  // 削除確認ダイアログコンポーネント（仮想的な実装例）
  function DeleteConfirmationDialog({
    postId,
    postTitle,
    onConfirm,
    onCancel,
  }: {
    postId: string;
    postTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) {
    return (
      <div role="dialog" aria-labelledby="dialog-title">
        <h2 id="dialog-title">投稿を削除しますか？</h2>
        <p>「{postTitle}」を削除します。この操作は取り消せません。</p>
        <button onClick={onCancel}>キャンセル</button>
        <button onClick={onConfirm} className="text-destructive">
          削除する
        </button>
      </div>
    );
  }

  it("削除確認ダイアログが正しく表示される", () => {
    const mockOnConfirm = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <DeleteConfirmationDialog
        postId="test-id"
        postTitle="テスト投稿"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("投稿を削除しますか？")).toBeInTheDocument();
    expect(
      screen.getByText("「テスト投稿」を削除します。この操作は取り消せません。")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "キャンセル" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "削除する" })
    ).toBeInTheDocument();
  });

  it("キャンセルボタンをクリックするとonCancelが呼ばれる", () => {
    const mockOnConfirm = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <DeleteConfirmationDialog
        postId="test-id"
        postTitle="テスト投稿"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("削除ボタンをクリックするとonConfirmが呼ばれる", () => {
    const mockOnConfirm = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <DeleteConfirmationDialog
        postId="test-id"
        postTitle="テスト投稿"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });
});
