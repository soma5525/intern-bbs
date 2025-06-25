
# プロジェクトの振り返り

このドキュメントは、Web掲示板アプリケーション開発プロジェクトについて、初学者がつまずきやすい点と、実装における工夫点をまとめたものです。

## 1. 初学者がつまずきやすい点

このプロジェクトで使われている技術スタックはモダンで強力ですが、初学者にとってはいくつか難しい概念が含まれています。

### 1.1. Next.js (App Router) と Server Components

- **Server Components vs. Client Components**: Next.js App Routerの最も大きな特徴ですが、サーバー側でレンダリングされるコンポーネントと、クライアント側（ブラウザ）でレンダリングされるコンポーネントの違いを理解するのが最初の関門です。特に、`"use client"` ディレクティブをいつ、なぜ使うのかを判断するのは難しいかもしれません。
- **Server Actions**: フォームの送信やデータの更新を、APIエンドポイントを作成せずにサーバー側の関数で直接処理できる強力な機能です。しかし、従来の「フロントエンドからバックエンドAPIを叩く」という考え方に慣れていると、データの流れが直感的でなく、混乱を招く可能性があります。状態管理やエラーハンドリングも独特の作法が求められます。

### 1.2. 認証フロー (Supabase)

- **サーバーサイドでの認証**: SupabaseのSSR（Server-Side Rendering）パッケージは、サーバーコンポーネントやミドルウェアでの認証状態の管理を容易にしますが、その裏側の仕組み（Cookieを利用したセッション管理など）は複雑です。`createClient` がクライアント用、サーバー用、ミドルウェア用で複数存在し、それぞれ使い分ける必要がある点を理解するのが難しいでしょう。
- **コールバックURLとリダイレクト**: サインアップ時やパスワードリセット時に、Supabaseから送られるメール内のリンクをクリックすると、アプリケーションの特定のURL（`/auth/callback`）にリダイレクトされます。この一連のフローや、リダイレクト先を適切に設定する `emailRedirectTo` オプションの役割を把握するのは簡単ではありません。

### 1.3. データベース連携 (Prisma)

- **データモデリング**: `prisma/schema.prisma` でデータベースのスキーマを定義しますが、リレーション（`@relation`）の設計は、データベースの基礎知識がないと難しい部分です。特に、`User` と `Post`、`Post` と `Reply` のような1対多の関係を正しく定義するところでつまずきがちです。
- **トランザクションの考え方**: 複数のデータベース操作をまとめて実行し、途中でエラーが起きたらすべてを元に戻す「トランザクション」は重要な概念です。このプロジェクトでは明示的なトランザクション（`$transaction`）は使われていませんが、後述する「ロールバック処理」のように、それに近い考え方が必要になる場面があります。

### 1.4. テスト (Jest)

- **モックの概念**: テスト対象のコードが依存している外部のモジュール（DB、APIクライアントなど）を、偽のオブジェクト（モック）に置き換えるという考え方そのものが、初学者には難しいかもしれません。`jest.mock()` の使い方や、非同期処理のモック（`mockResolvedValue`）などを使いこなすには慣れが必要です。
- **Server Actionsのテスト**: Server Actionsはサーバー環境に依存するため、ユニットテストや統合テストを行うのが比較的困難です。`next/headers` や `next/navigation` など、Next.js特有の関数をモックする必要があり、テストのセットアップが複雑になりがちです。

## 2. 工夫した点：安全なプロフィール更新処理

このプロジェクトの中でも、特にユーザーのプロフィール更新機能の実装には工夫を凝らしました。

ユーザー情報は、**Supabaseの認証情報**と、**Prismaで管理するデータベースのプロフィール情報**の2箇所に保存されています。これら両方を同時に更新する必要があり、片方だけの更新で処理が終わってしまうと、データの不整合が発生してしまいます。

そこで、`app/actions/user.ts` の `updateUserProfile` 関数に、**手動ロールバック処理**を実装しました。

```typescript:app/actions/user.ts
export async function updateUserProfile(formData: FormData) {
  const user = await getCurrentUser();
  const profileData = await getProfileData();

  if (!user) {
    return { error: "ユーザーが見つかりません" };
  }

  const supabase = await createClient();

  // 1. Supabaseの認証情報を先に更新
  const { error: authErr, data: updatedAuth } = await supabase.auth.updateUser({
    email: profileData.email,
    data: { full_name: profileData.name },
  });

  if (authErr) {
    return { error: authErr.message };
  }

  try {
    // 2. Prismaのデータベースを更新
    await prisma.userProfile.update({
      where: { id: user.id },
      data: { name: profileData.name, email: profileData.email },
    });
  } catch (dbErr) {
    // 3. DB更新に失敗した場合、Supabaseの更新を元に戻す（ロールバック）
    await supabase.auth.updateUser({ email: user.email }); // 元のメールアドレスに戻す
    return { error: "データベース更新に失敗しました" };
  }

  revalidatePath("/protected/profile/edit");
  return { success: true };
}
```

### 工夫のポイント

1.  **更新の順番**: まずSupabaseの認証情報を更新し、それが成功した場合にのみPrismaのデータベースを更新するようにしています。
2.  **エラーハンドリングとロールバック**: `try...catch` ブロックを使い、Prismaのデータベース更新（`prisma.userProfile.update`）でエラーが発生した場合を捕捉します。`catch` ブロック内では、先に行ったSupabaseの認証情報の更新を元に戻す処理（`supabase.auth.updateUser({ email: user.email })`）を実行しています。これにより、データベースの更新に失敗しても、認証情報だけが変更されたままになる、というデータの不整合を防いでいます。
3.  **ユーザーへのフィードバック**: ロールバック処理を行った上で、ユーザーには明確なエラーメッセージ（"データベース更新に失敗しました"）を返すようにしています。

このように、複数のデータソースを扱う処理では、エラーが発生した場合の復旧処理（ロールバック）を考慮することが、堅牢なアプリケーションを開発する上で非常に重要です。
