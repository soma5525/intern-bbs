import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PostForm } from "@/components/post-form";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  useFormStatus: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseFormStatus = require("react-dom")
  .useFormStatus as jest.MockedFunction<any>;

describe("PostForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
    // デフォルトではpending: falseを返す
    mockUseFormStatus.mockReturnValue({ pending: false });
  });

  describe("新規投稿フォーム", () => {
    it("新規投稿フォームが正しく表示される", () => {
      const mockAction = jest.fn();
      render(<PostForm type="create" action={mockAction} />);

      expect(screen.getByText("新規投稿")).toBeInTheDocument();
      expect(screen.getByText("新しい投稿を作成")).toBeInTheDocument();
      expect(screen.getByLabelText("タイトル")).toBeInTheDocument();
      expect(screen.getByLabelText("内容")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "投稿" })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "キャンセル" })
      ).toBeInTheDocument();
    });

    it("必須項目が設定されている", () => {
      const mockAction = jest.fn();
      render(<PostForm type="create" action={mockAction} />);
      expect(screen.getByRole("textbox", { name: "タイトル" })).toHaveAttribute(
        "required"
      );
      expect(screen.getByRole("textbox", { name: "内容" })).toHaveAttribute(
        "required"
      );

      expect(screen.getByRole("textbox", { name: "タイトル" })).toHaveAttribute(
        "maxLength",
        "150"
      );
    });

    it("フォーム入力値が正しく設定される", () => {
      const mockAction = jest.fn();
      render(<PostForm type="create" action={mockAction} />);

      const titleInput = screen.getByRole("textbox", { name: "タイトル" });
      const contentTextarea = screen.getByRole("textbox", { name: "内容" });

      fireEvent.change(titleInput, { target: { value: "テストタイトル" } });
      fireEvent.change(contentTextarea, { target: { value: "テスト内容" } });

      expect(titleInput).toHaveValue("テストタイトル");
      expect(contentTextarea).toHaveValue("テスト内容");
    });

    it("投稿成功時にリダイレクトされる", async () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });
      render(<PostForm type="create" action={mockAction} />);

      const titleInput = screen.getByRole("textbox", { name: "タイトル" });
      const contentTextarea = screen.getByRole("textbox", { name: "内容" });
      const submitButton = screen.getByRole("button", { name: "投稿" });

      fireEvent.change(titleInput, { target: { value: "テストタイトル" } });
      fireEvent.change(contentTextarea, { target: { value: "テスト内容" } });
      fireEvent.click(submitButton);

      // まずmockActionが呼ばれることを確認
      await waitFor(() => {
        expect(mockAction).toHaveBeenCalled();
      });

      // 少し待ってからリダイレクトが呼ばれることを確認
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/protected/posts");
      });
    });

    it("投稿エラー時にエラーメッセージが表示される", async () => {
      const mockAction = jest
        .fn()
        .mockResolvedValue({ error: "投稿に失敗しました" });
      render(<PostForm type="create" action={mockAction} />);

      const titleInput = screen.getByRole("textbox", {
        name: "タイトル",
      });
      const contentTextarea = screen.getByRole("textbox", { name: "内容" });
      const submitButton = screen.getByRole("button", { name: "投稿" });
      fireEvent.change(titleInput, { target: { value: "テストタイトル" } });
      fireEvent.change(contentTextarea, { target: { value: "テスト内容" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("投稿に失敗しました")).toBeInTheDocument();
      });
    });

    it("投稿中はローディング状態になる", async () => {
      // useFormStatusがpending: trueを返すようにモック
      mockUseFormStatus.mockReturnValue({ pending: true });

      const mockAction = jest.fn();
      render(<PostForm type="create" action={mockAction} />);

      // ローディング状態のボタンが表示されることを確認
      const loadingButton = screen.getByRole("button", { name: "投稿中..." });
      expect(loadingButton).toBeDisabled();
      expect(loadingButton).toBeInTheDocument();
    });

    it("フォーム送信状態ではないときはボタンが有効", () => {
      // useFormStatusがpending: falseを返すようにモック
      mockUseFormStatus.mockReturnValue({ pending: false });

      const mockAction = jest.fn();
      render(<PostForm type="create" action={mockAction} />);

      const submitButton = screen.getByRole("button", { name: "投稿" });
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe("編集フォーム", () => {
    const initialData = {
      id: "test-id",
      title: "既存のタイトル",
      content: "既存の内容",
    };

    it("編集フォームが正しく表示される", () => {
      const mockAction = jest.fn();
      // TODO: PostFormコンポーネントをレンダリング（type="edit", initialDataあり）
      render(
        <PostForm type="edit" action={mockAction} initialData={initialData} />
      );
      expect(screen.getByText("編集")).toBeInTheDocument();
      expect(screen.getByText("投稿を編集")).toBeInTheDocument();
      expect(screen.getByLabelText("タイトル")).toHaveValue(initialData.title);
      expect(screen.getByLabelText("内容")).toHaveValue(initialData.content);
      expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "キャンセル" })
      ).toBeInTheDocument();
    });

    it("hiddenフィールドにIDが設定される", () => {
      const mockAction = jest.fn();
      render(
        <PostForm type="edit" action={mockAction} initialData={initialData} />
      );
      // TODO: PostFormコンポーネントをレンダリング（編集モード）

      const hiddenInput = document.querySelector(
        'input[name="id"]'
      ) as HTMLInputElement;
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput.value).toBe(initialData.id);
    });

    it("編集成功時にリダイレクトされる", async () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });
      render(
        <PostForm type="edit" action={mockAction} initialData={initialData} />
      );

      const submitButton = screen.getByRole("button", { name: "更新" });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalledWith(expect.any(FormData));
        expect(mockPush).toHaveBeenCalledWith("/protected/posts");
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("予期しないエラー時にエラーメッセージが表示される", async () => {
      const mockAction = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));
      render(<PostForm type="create" action={mockAction} />);

      const titleInput = screen.getByRole("textbox", { name: "タイトル" });
      const contentTextarea = screen.getByRole("textbox", { name: "内容" });
      const submitButton = screen.getByRole("button", { name: "投稿" });

      fireEvent.change(titleInput, { target: { value: "テストタイトル" } });
      fireEvent.change(contentTextarea, { target: { value: "テスト内容" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("予期しないエラーが発生しました")
        ).toBeInTheDocument();
      });
    });

    it("actionが何も返さない場合にエラーメッセージが表示される", async () => {
      const mockAction = jest.fn().mockResolvedValue(undefined);
      render(<PostForm type="create" action={mockAction} />);

      const titleInput = screen.getByRole("textbox", { name: "タイトル" });
      const contentTextarea = screen.getByRole("textbox", { name: "内容" });
      const submitButton = screen.getByRole("button", { name: "投稿" });

      fireEvent.change(titleInput, { target: { value: "テストタイトル" } });
      fireEvent.change(contentTextarea, { target: { value: "テスト内容" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("投稿処理に失敗しました。")
        ).toBeInTheDocument();
      });
    });
  });

  describe("フォームデータの送信", () => {
    it("正しいフォームデータが送信される", async () => {
      const mockAction = jest.fn().mockResolvedValue({ success: true });
      render(<PostForm type="create" action={mockAction} />);

      const titleInput = screen.getByRole("textbox", { name: "タイトル" });
      const contentTextarea = screen.getByRole("textbox", { name: "内容" });
      const submitButton = screen.getByRole("button", { name: "投稿" });

      fireEvent.change(titleInput, { target: { value: "テストタイトル" } });
      fireEvent.change(contentTextarea, { target: { value: "テスト内容" } });
      fireEvent.click(submitButton);
      // TODO: waitForを使って以下を確認
      // - mockActionがFormDataで呼ばれることを確認
      // - FormDataから値を取得して確認
      await waitFor(() => {
        expect(mockAction).toHaveBeenCalledWith(expect.any(FormData));
        const formData = mockAction.mock.calls[0][0] as FormData; // [0]はmockActionの呼び出し回数、[0]はFormData
        expect(formData.get("title")).toBe("テストタイトル");
        expect(formData.get("content")).toBe("テスト内容");
      });
    });

    it("編集時にIDが含まれる", async () => {
      // TODO: mockActionが{ success: true }を返すように設定
      const mockAction = jest.fn().mockResolvedValue({ success: true });

      const initialData = {
        id: "test-id",
        title: "既存のタイトル",
        content: "既存の内容",
      };
      render(
        <PostForm type="edit" action={mockAction} initialData={initialData} />
      );
      const submitButton = screen.getByRole("button", { name: "更新" });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAction).toHaveBeenCalledWith(expect.any(FormData));
        const formData = mockAction.mock.calls[0][0] as FormData;
        expect(formData.get("id")).toBe("test-id");
      });
    });
  });
});
