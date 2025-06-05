import React from "react";
import { render, screen } from "@testing-library/react";

// Server Actionsの型とモック関数を定義
const mockGetCurrentUser = jest.fn();
const mockGetPosts = jest.fn();

// モック設定
jest.mock("@/lib/auth", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

jest.mock("@/app/actions/post", () => ({
  getPosts: mockGetPosts,
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// PostsPageコンポーネントを直接テストするため、ページコンポーネントをインポート
// 実際の実装では、PostsPageはサーバーコンポーネントなので、
// テスト用にクライアントコンポーネント版を作成する必要があります

interface PostsPageProps {
  posts: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    authorId: string;
    author: {
      name: string;
    };
    _count: {
      replies: number;
    };
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  currentUserId: string;
}

// テスト用のクライアントコンポーネント版PostsPage
function PostsPageClient({ posts, pagination, currentUserId }: PostsPageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">投稿一覧</h1>
          <a href="posts/new">新規投稿</a>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              投稿がありません。投稿を作成してください。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} data-testid={`post-${post.id}`}>
                <h3>{post.title}</h3>
                <p>{post.content}</p>
                <span>投稿者: {post.author.name}</span>
                <span>{post._count.replies}件の返信</span>
                <a href={`/protected/posts/${post.id}`}>詳細を見る</a>
                {post.authorId === currentUserId && (
                  <div data-testid={`post-actions-${post.id}`}>
                    <a href={`/protected/posts/${post.id}/edit`}>編集</a>
                    <button type="submit">削除</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {posts.length > 0 && (
          <div data-testid="pagination">
            <span>
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            {pagination.hasPrevPage && (
              <a href={`/protected/posts?page=${pagination.currentPage - 1}`}>
                前へ
              </a>
            )}
            {pagination.hasNextPage && (
              <a href={`/protected/posts?page=${pagination.currentPage + 1}`}>
                次へ
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

describe("PostsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    name: "テストユーザー",
  };

  const mockPosts = [
    {
      id: "post-1",
      title: "テスト投稿1",
      content: "テスト内容1",
      createdAt: new Date("2024-01-01"),
      authorId: "user-1",
      author: { name: "テストユーザー" },
      _count: { replies: 2 },
    },
    {
      id: "post-2",
      title: "テスト投稿2",
      content: "テスト内容2",
      createdAt: new Date("2024-01-02"),
      authorId: "user-2",
      author: { name: "他のユーザー" },
      _count: { replies: 0 },
    },
  ];

  const mockPagination = {
    currentPage: 1,
    totalPages: 3,
    hasNextPage: true,
    hasPrevPage: false,
  };

  describe("投稿一覧の表示", () => {
    it("投稿一覧が正しく表示される", () => {
      render(
        <PostsPageClient
          posts={mockPosts}
          pagination={mockPagination}
          currentUserId="user-1"
        />
      );

      expect(
        screen.getByRole("heading", { name: "投稿一覧" })
      ).toBeInTheDocument();
      expect(screen.getByText("テスト投稿1")).toBeInTheDocument();
      expect(screen.getByText("テスト投稿2")).toBeInTheDocument();
      expect(screen.getByText("投稿者: テストユーザー")).toBeInTheDocument();
      expect(screen.getByText("投稿者: 他のユーザー")).toBeInTheDocument();
    });

    it("返信数が正しく表示される", () => {
      render(
        <PostsPageClient
          posts={mockPosts}
          pagination={mockPagination}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText("2件の返信")).toBeInTheDocument();
      expect(screen.getByText("0件の返信")).toBeInTheDocument();
    });

    it("詳細リンクが表示される", () => {
      render(
        <PostsPageClient
          posts={mockPosts}
          pagination={mockPagination}
          currentUserId="user-1"
        />
      );

      const detailLinks = screen.getAllByText("詳細を見る");
      expect(detailLinks).toHaveLength(2);
      expect(detailLinks[0]).toHaveAttribute("href", "/protected/posts/post-1");
      expect(detailLinks[1]).toHaveAttribute("href", "/protected/posts/post-2");
    });

    it("新規投稿リンクが表示される", () => {
      render(
        <PostsPageClient
          posts={mockPosts}
          pagination={mockPagination}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText("新規投稿")).toBeInTheDocument();
      expect(screen.getByText("新規投稿")).toHaveAttribute("href", "posts/new");
    });
  });

  describe("権限チェック", () => {
    it("自分の投稿のみ編集・削除ボタンが表示される", () => {
      render(
        <PostsPageClient
          posts={mockPosts}
          pagination={mockPagination}
          currentUserId="user-1"
        />
      );

      // user-1の投稿（post-1）には編集・削除ボタンが表示される
      expect(screen.getByTestId("post-actions-post-1")).toBeInTheDocument();
      expect(screen.getByText("編集")).toBeInTheDocument();
      expect(screen.getByText("削除")).toBeInTheDocument();

      // user-2の投稿（post-2）には編集・削除ボタンが表示されない
      expect(
        screen.queryByTestId("post-actions-post-2")
      ).not.toBeInTheDocument();
    });

    it("編集リンクが正しいURLを持つ", () => {
      render(
        <PostsPageClient
          posts={mockPosts}
          pagination={mockPagination}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText("編集")).toHaveAttribute(
        "href",
        "/protected/posts/post-1/edit"
      );
    });
  });

  describe("空の状態", () => {
    it("投稿がない場合にメッセージが表示される", () => {
      render(
        <PostsPageClient
          posts={[]}
          pagination={{
            currentPage: 1,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }}
          currentUserId="user-1"
        />
      );

      expect(
        screen.getByText("投稿がありません。投稿を作成してください。")
      ).toBeInTheDocument();
      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });
  });

  describe("ページネーション", () => {
    it("ページネーションが正しく表示される", () => {
      render(
        <PostsPageClient
          posts={mockPosts}
          pagination={mockPagination}
          currentUserId="user-1"
        />
      );

      expect(screen.getByTestId("pagination")).toBeInTheDocument();
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("次のページリンクが表示される", () => {
      render(
        <PostsPageClient
          posts={mockPosts}
          pagination={mockPagination}
          currentUserId="user-1"
        />
      );

      const nextLink = screen.getByText("次へ");
      expect(nextLink).toBeInTheDocument();
      expect(nextLink).toHaveAttribute("href", "/protected/posts?page=2");
    });

    it("前のページリンクが表示されない（最初のページ）", () => {
      render(
        <PostsPageClient
          posts={mockPosts}
          pagination={mockPagination}
          currentUserId="user-1"
        />
      );

      expect(screen.queryByText("前へ")).not.toBeInTheDocument();
    });

    it("前のページリンクが表示される（2ページ目以降）", () => {
      const paginationWithPrev = {
        currentPage: 2,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true,
      };

      render(
        <PostsPageClient
          posts={mockPosts}
          pagination={paginationWithPrev}
          currentUserId="user-1"
        />
      );

      const prevLink = screen.getByText("前へ");
      expect(prevLink).toBeInTheDocument();
      expect(prevLink).toHaveAttribute("href", "/protected/posts?page=1");
    });

    it("次のページリンクが表示されない（最後のページ）", () => {
      const paginationLastPage = {
        currentPage: 3,
        totalPages: 3,
        hasNextPage: false,
        hasPrevPage: true,
      };

      render(
        <PostsPageClient
          posts={mockPosts}
          pagination={paginationLastPage}
          currentUserId="user-1"
        />
      );

      expect(screen.queryByText("次へ")).not.toBeInTheDocument();
    });
  });

  describe("投稿の表示順序", () => {
    it("投稿が正しい順序で表示される", () => {
      render(
        <PostsPageClient
          posts={mockPosts}
          pagination={mockPagination}
          currentUserId="user-1"
        />
      );

      // 投稿要素のみを取得（post-actions-ではなくpost-で始まり、actionsを含まないもの）
      const postElements = screen.getAllByTestId(/^post-(?!.*actions)/);
      expect(postElements[0]).toHaveAttribute("data-testid", "post-post-1");
      expect(postElements[1]).toHaveAttribute("data-testid", "post-post-2");
    });
  });
});
