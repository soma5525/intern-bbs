import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReplyForm } from "@/components/reply-form";
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

describe("ReplyForm", () => {
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

  const mockAction = jest.fn();
  const parentId = "parent-post-id";

  describe("新規返信フォーム", () => {
    it("新規返信フォームが正しく表示される", () => {
      render(<ReplyForm parentId={parentId} action={mockAction} />);

      expect(screen.getByText("返信を投稿")).toBeInTheDocument();
      expect(
        screen.getByText("この投稿に返信してください")
      ).toBeInTheDocument();
      expect(screen.getByLabelText("返信内容")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "返信する" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "クリア" })
      ).toBeInTheDocument();
    });

    it("必須項目が設定されている", () => {
      render(<ReplyForm parentId={parentId} action={mockAction} />);

      const contentTextarea = screen.getByLabelText("返信内容");
      expect(contentTextarea).toHaveAttribute("required");
      expect(contentTextarea).toHaveAttribute(
        "placeholder",
        "返信内容を入力してください..."
      );
    });

    it("フォーム入力値が正しく設定される", () => {
      render(<ReplyForm parentId={parentId} action={mockAction} />);

      const contentTextarea = screen.getByLabelText("返信内容");
      fireEvent.change(contentTextarea, {
        target: { value: "テスト返信内容" },
      });

      expect(contentTextarea).toHaveValue("テスト返信内容");
    });

    it("空の内容では返信ボタンが無効になる", () => {
      render(<ReplyForm parentId={parentId} action={mockAction} />);

      const replyButton = screen.getByRole("button", { name: "返信する" });
      expect(replyButton).toBeDisabled();
    });

    it("内容を入力すると返信ボタンが有効になる", () => {
      render(<ReplyForm parentId={parentId} action={mockAction} />);

      const contentTextarea = screen.getByLabelText("返信内容");
      const replyButton = screen.getByRole("button", { name: "返信する" });

      fireEvent.change(contentTextarea, {
        target: { value: "テスト返信内容" },
      });

      expect(replyButton).toBeEnabled();
    });

    it("返信成功時にフォームがクリアされページが更新される", async () => {
      mockAction.mockResolvedValue({ success: true });
      render(<ReplyForm parentId={parentId} action={mockAction} />);

      const contentTextarea = screen.getByLabelText("返信内容");
      const replyButton = screen.getByRole("button", { name: "返信する" });

      fireEvent.change(contentTextarea, {
        target: { value: "テスト返信内容" },
      });
      fireEvent.click(replyButton);

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalledWith(parentId, expect.any(FormData));
        expect(mockRefresh).toHaveBeenCalled();
      });

      // フォームがクリアされることを確認
      expect(contentTextarea).toHaveValue("");
    });

    it("返信エラー時にエラーメッセージが表示される", async () => {
      mockAction.mockResolvedValue({ error: "返信に失敗しました" });
      render(<ReplyForm parentId={parentId} action={mockAction} />);

      const contentTextarea = screen.getByLabelText("返信内容");
      const replyButton = screen.getByRole("button", { name: "返信する" });

      fireEvent.change(contentTextarea, {
        target: { value: "テスト返信内容" },
      });
      fireEvent.click(replyButton);

      await waitFor(() => {
        expect(screen.getByText("返信に失敗しました")).toBeInTheDocument();
      });
    });

    it("クリアボタンで内容がクリアされる", () => {
      render(<ReplyForm parentId={parentId} action={mockAction} />);

      const contentTextarea = screen.getByLabelText("返信内容");
      const clearButton = screen.getByRole("button", { name: "クリア" });

      fireEvent.change(contentTextarea, {
        target: { value: "テスト返信内容" },
      });
      expect(contentTextarea).toHaveValue("テスト返信内容");

      fireEvent.click(clearButton);
      expect(contentTextarea).toHaveValue("");
    });
  });

  describe("編集フォーム", () => {
    const initialData = {
      id: "reply-id",
      content: "既存の返信内容",
    };

    it("編集フォームが正しく表示される", () => {
      render(
        <ReplyForm
          parentId={parentId}
          action={mockAction}
          type="edit"
          initialData={initialData}
        />
      );

      expect(screen.getByText("返信を編集")).toBeInTheDocument();
      expect(
        screen.getByText("返信内容を編集してください")
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("既存の返信内容")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "更新する" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "キャンセル" })
      ).toBeInTheDocument();
    });

    it("hiddenフィールドにIDが設定される", () => {
      render(
        <ReplyForm
          parentId={parentId}
          action={mockAction}
          type="edit"
          initialData={initialData}
        />
      );

      const hiddenInput = document.querySelector(
        'input[name="id"]'
      ) as HTMLInputElement;
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput.value).toBe("reply-id");
    });

    it("編集成功時にリダイレクトされる", async () => {
      mockAction.mockResolvedValue({ success: true });
      render(
        <ReplyForm
          parentId={parentId}
          action={mockAction}
          type="edit"
          initialData={initialData}
        />
      );

      const updateButton = screen.getByRole("button", { name: "更新する" });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalledWith(parentId, expect.any(FormData));
        expect(mockPush).toHaveBeenCalledWith(`/protected/posts/${parentId}`);
      });
    });

    it("キャンセルリンクが正しいURLを持つ", () => {
      render(
        <ReplyForm
          parentId={parentId}
          action={mockAction}
          type="edit"
          initialData={initialData}
        />
      );

      const cancelLink = screen.getByRole("link", { name: "キャンセル" });
      expect(cancelLink).toHaveAttribute(
        "href",
        `/protected/posts/${parentId}`
      );
    });

    it("クリアボタンで初期値に戻る", () => {
      render(
        <ReplyForm
          parentId={parentId}
          action={mockAction}
          type="edit"
          initialData={initialData}
        />
      );

      const contentTextarea = screen.getByLabelText("返信内容");
      const clearButton = screen.getByRole("button", { name: "クリア" });

      // 内容を変更
      fireEvent.change(contentTextarea, {
        target: { value: "変更された内容" },
      });
      expect(contentTextarea).toHaveValue("変更された内容");

      // クリアボタンで初期値に戻る
      fireEvent.click(clearButton);
      expect(contentTextarea).toHaveValue("既存の返信内容");
    });
  });

  describe("ローディング状態（useFormStatus使用）", () => {
    it("返信中はローディング状態になる", () => {
      // useFormStatusがpending: trueを返すようにモック
      mockUseFormStatus.mockReturnValue({ pending: true });

      render(<ReplyForm parentId={parentId} action={mockAction} />);

      // ローディング状態のボタンが表示されることを確認
      const loadingButton = screen.getByRole("button", { name: "投稿中..." });
      expect(loadingButton).toBeDisabled();
      expect(loadingButton).toBeInTheDocument();

      // クリアボタンも無効になることを確認
      const clearButton = screen.getByRole("button", { name: "クリア" });
      expect(clearButton).toBeDisabled();
    });

    it("編集中はローディング状態になる", () => {
      // useFormStatusがpending: trueを返すようにモック
      mockUseFormStatus.mockReturnValue({ pending: true });

      const initialData = {
        id: "reply-id",
        content: "既存の返信内容",
      };

      render(
        <ReplyForm
          parentId={parentId}
          action={mockAction}
          type="edit"
          initialData={initialData}
        />
      );

      // ローディング状態のボタンが表示されることを確認
      const loadingButton = screen.getByRole("button", { name: "更新中..." });
      expect(loadingButton).toBeDisabled();
      expect(loadingButton).toBeInTheDocument();
    });

    it("フォーム送信状態ではないときはボタンが有効", () => {
      // useFormStatusがpending: falseを返すようにモック
      mockUseFormStatus.mockReturnValue({ pending: false });

      render(<ReplyForm parentId={parentId} action={mockAction} />);

      const contentTextarea = screen.getByLabelText("返信内容");
      fireEvent.change(contentTextarea, {
        target: { value: "テスト返信内容" },
      });

      const submitButton = screen.getByRole("button", { name: "返信する" });
      const clearButton = screen.getByRole("button", { name: "クリア" });

      expect(submitButton).not.toBeDisabled();
      expect(clearButton).not.toBeDisabled();
    });
  });

  describe("エラーハンドリング", () => {
    it("予期しないエラー時にエラーメッセージが表示される", async () => {
      mockAction.mockRejectedValue(new Error("Network error"));
      render(<ReplyForm parentId={parentId} action={mockAction} />);

      const contentTextarea = screen.getByLabelText("返信内容");
      const replyButton = screen.getByRole("button", { name: "返信する" });

      fireEvent.change(contentTextarea, {
        target: { value: "テスト返信内容" },
      });
      fireEvent.click(replyButton);

      await waitFor(() => {
        expect(
          screen.getByText("予期せぬエラーが発生しました")
        ).toBeInTheDocument();
      });
    });

    it("クリアボタンでエラーメッセージもクリアされる", async () => {
      mockAction.mockResolvedValue({ error: "返信に失敗しました" });
      render(<ReplyForm parentId={parentId} action={mockAction} />);

      const contentTextarea = screen.getByLabelText("返信内容");
      const replyButton = screen.getByRole("button", { name: "返信する" });
      const clearButton = screen.getByRole("button", { name: "クリア" });

      fireEvent.change(contentTextarea, {
        target: { value: "テスト返信内容" },
      });
      fireEvent.click(replyButton);

      await waitFor(() => {
        expect(screen.getByText("返信に失敗しました")).toBeInTheDocument();
      });

      fireEvent.click(clearButton);
      expect(screen.queryByText("返信に失敗しました")).not.toBeInTheDocument();
    });
  });

  describe("フォームデータの送信", () => {
    it("正しいフォームデータが送信される", async () => {
      mockAction.mockResolvedValue({ success: true });
      render(<ReplyForm parentId={parentId} action={mockAction} />);

      const contentTextarea = screen.getByLabelText("返信内容");
      const replyButton = screen.getByRole("button", { name: "返信する" });

      fireEvent.change(contentTextarea, {
        target: { value: "テスト返信内容" },
      });
      fireEvent.click(replyButton);

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalledWith(parentId, expect.any(FormData));
        const formData = mockAction.mock.calls[0][1] as FormData;
        expect(formData.get("content")).toBe("テスト返信内容");
      });
    });

    it("編集時にIDが含まれる", async () => {
      mockAction.mockResolvedValue({ success: true });
      const initialData = {
        id: "reply-id",
        content: "既存の返信内容",
      };

      render(
        <ReplyForm
          parentId={parentId}
          action={mockAction}
          type="edit"
          initialData={initialData}
        />
      );

      const updateButton = screen.getByRole("button", { name: "更新する" });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalledWith(parentId, expect.any(FormData));
        const formData = mockAction.mock.calls[0][1] as FormData;
        expect(formData.get("id")).toBe("reply-id");
      });
    });
  });
});
