import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-indigo-700 mb-4">GBF Checker</h1>
        <p className="text-gray-600 text-lg max-w-xl mx-auto">
          グランブルーファンタジーのキャラクター・召喚石・武器の所持状況を管理するチェッカーです。
          GBF Wiki のデータを元に、属性・武器種・カテゴリでフィルタリングできます。
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          href="/characters"
          title="⚔️ キャラクター"
          desc="SSRキャラクターの属性・得意武器・カテゴリ・スキル・サポアビを確認できます。"
        />
        <FeatureCard
          href="/summons"
          title="🌟 召喚石"
          desc="召喚石のメイン加護・サブ加護・属性・カテゴリを一覧表示します。"
        />
        <FeatureCard
          href="/weapons"
          title="🗡️ 武器"
          desc="武器のスキル・武器種・属性を一覧表示します。複数所持も管理できます。"
        />
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
        <h2 className="text-xl font-semibold text-indigo-800 mb-2">所持チェッカー</h2>
        <p className="text-gray-600 mb-4">
          アカウントを作成してログインすると、所持しているキャラクター・召喚石・武器を記録できます。
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/auth/signup"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium"
          >
            新規登録
          </Link>
          <Link
            href="/auth/signin"
            className="border border-indigo-600 text-indigo-600 px-6 py-2 rounded-lg hover:bg-indigo-50 font-medium"
          >
            ログイン
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{desc}</p>
    </Link>
  );
}
