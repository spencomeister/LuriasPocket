import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-gradient mb-4 animate-fade-slide-up font-title">ルリアのぽけっと手帳</h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto animate-fade-slide-up" style={{ "--stagger": 1 } as React.CSSProperties}>
          グランブルーファンタジーのキャラクター・召喚石・武器の所持状況をかんたん管理♪
          属性・武器種・カテゴリでフィルタリングできます。
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard href="/characters" title="⚔️ キャラクター" desc="SSRキャラクターの属性・得意武器・カテゴリ・スキル・サポアビを確認できます。" i={0} />
        <FeatureCard href="/summons" title="🌟 召喚石" desc="召喚石のメイン加護・サブ加護・属性・カテゴリを一覧表示します。" i={1} />
        <FeatureCard href="/weapons" title="🗡️ 武器" desc="武器のスキル・武器種・属性を一覧表示します。複数所持も管理できます。" i={2} />
      </section>

      <section className="glass rounded-xl p-8 text-center border border-white/10 animate-fade-slide-up" style={{ "--stagger": 5 } as React.CSSProperties}>
        <h2 className="text-xl font-semibold text-gradient mb-2">所持チェッカー</h2>
        <p className="text-gray-400 mb-6">
          アカウントを作成してログインすると、所持しているキャラクター・召喚石・武器を記録できます。
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/auth/signup"
            className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-6 py-2 rounded-lg hover:bg-sky-500/30 font-medium transition-colors"
          >
            新規登録
          </Link>
          <Link
            href="/auth/signin"
            className="border border-white/10 text-gray-300 px-6 py-2 rounded-lg hover:bg-white/10 font-medium transition-colors"
          >
            ログイン
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ href, title, desc, i }: { href: string; title: string; desc: string; i: number }) {
  return (
    <Link
      href={href}
      className="glass glass-hover rounded-xl p-6 block border border-white/10 animate-fade-slide-up transition-all"
      style={{ "--stagger": i + 2 } as React.CSSProperties}
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{desc}</p>
    </Link>
  );
}
