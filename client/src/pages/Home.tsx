import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, BookOpenText, Braces, Clock3, Plus, Tag } from "lucide-react";
import { useLocation } from "wouter";

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(new Date(value));
}

export default function Home() {
  const [, setLocation] = useLocation();
  const overview = trpc.dashboard.overview.useQuery();
  const data = overview.data;

  return (
    <div className="min-h-full paper-noise">
      <header className="border-b border-[#dfddd5] bg-[#f8f7f3]/85 px-6 py-5 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div><p className="font-mono-editor text-[10px] font-medium uppercase tracking-[0.18em] text-[#6e7381]">Knowledge workspace</p><h1 className="font-display mt-1 text-3xl text-[#202c3d] md:text-4xl">Your debugging field notes.</h1></div>
          <Button onClick={() => setLocation("/articles/new")} className="rounded-xl bg-[#263950] px-4 text-white shadow-sm hover:bg-[#1d2e43]"><Plus className="mr-1.5 h-4 w-4" />New article</Button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">
        <section className="grid gap-4 md:grid-cols-[1.45fr_0.8fr_0.8fr]">
          <div className="rounded-3xl bg-[#263950] p-6 text-white shadow-[0_20px_45px_rgba(38,57,80,0.16)] md:p-8">
            <div className="flex items-start justify-between"><div><p className="font-mono-editor text-[10px] uppercase tracking-[0.16em] text-[#d8ba72]">Knowledge base</p><p className="font-display mt-5 text-6xl leading-none">{data?.totalArticles ?? "—"}</p><p className="mt-3 text-sm text-slate-200">蓄積されたデバッグ知見</p></div><BookOpenText className="h-7 w-7 text-[#d8ba72]" /></div>
            <button onClick={() => setLocation("/articles")} className="mt-8 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-[#f5df9d] hover:text-white">LIBRARY を開く <ArrowUpRight className="h-3.5 w-3.5" /></button>
          </div>
          <Metric icon={Braces} label="Active categories" value={data?.categoryBreakdown.length ?? "—"} detail="分類済みの問題領域" />
          <Metric icon={Tag} label="Tag vocabulary" value={data?.popularTags.length ?? "—"} detail="検索可能なタグ" />
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="rounded-3xl border border-[#dfddd5] bg-[#fffefb] p-5 shadow-[0_12px_26px_rgba(38,57,80,0.05)] md:p-7">
            <div className="mb-5 flex items-end justify-between gap-4"><div><p className="font-mono-editor text-[10px] uppercase tracking-[0.16em] text-[#727785]">Recently refined</p><h2 className="font-display mt-1 text-2xl text-[#24364b]">Recent articles</h2></div><button onClick={() => setLocation("/articles")} className="text-xs font-bold text-[#344c69] hover:underline">VIEW ALL</button></div>
            <div className="divide-y divide-[#e7e4dc]">{overview.isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton className="my-3 h-16 w-full" key={i} />) : data?.recentArticles.length ? data.recentArticles.map(article => <button key={article.id} onClick={() => setLocation(`/articles/${article.id}`)} className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-[#faf9f5]"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef0ec] font-mono-editor text-xs font-bold text-[#536a86]">{article.language.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#25364b]">{article.title}</p><p className="mt-1 text-xs text-[#777d88]">{article.category} · {article.tags.join(" · ") || "untagged"}</p></div><span className="hidden text-xs text-[#7c818c] sm:block">{formatDate(article.updatedAt)}</span></button>) : <EmptyPrompt onCreate={() => setLocation("/articles/new")} />}</div>
          </div>
          <div className="space-y-5">
            <div className="rounded-3xl border border-[#dfddd5] bg-[#fffefb] p-6 shadow-[0_12px_26px_rgba(38,57,80,0.05)]"><p className="font-mono-editor text-[10px] uppercase tracking-[0.16em] text-[#727785]">Top signals</p><h2 className="font-display mt-1 text-2xl text-[#24364b]">Popular tags</h2><div className="mt-5 flex flex-wrap gap-2">{data?.popularTags.length ? data.popularTags.map(tag => <button key={tag.name} onClick={() => setLocation(`/articles?tag=${encodeURIComponent(tag.name)}`)} className="rounded-full border border-[#dfe2dd] bg-[#f8f8f5] px-3 py-1.5 text-xs font-semibold text-[#43536b] transition hover:border-[#9aaac0] hover:bg-white">#{tag.name} <span className="ml-1 text-[#8a909a]">{tag.value}</span></button>) : <p className="py-3 text-sm text-[#858a94]">タグは記事の保存後に表示されます。</p>}</div></div>
            <div className="rounded-3xl border border-[#dfddd5] bg-[#fffefb] p-6 shadow-[0_12px_26px_rgba(38,57,80,0.05)]"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#bd9550]" /><p className="font-mono-editor text-[10px] uppercase tracking-[0.16em] text-[#727785]">Category distribution</p></div><div className="mt-5 space-y-3">{data?.categoryBreakdown.length ? data.categoryBreakdown.map((category, index) => <div key={category.name}><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold text-[#44536a]">{category.name}</span><span className="text-[#7e8490]">{category.value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#ebe9e2]"><div className="h-full rounded-full bg-[#526b88]" style={{ width: `${Math.max(8, (category.value / Math.max(...data.categoryBreakdown.map(v => v.value))) * 100)}%`, opacity: 1 - index * 0.1 }} /></div></div>) : <p className="py-2 text-sm text-[#858a94]">カテゴリ別の集計はまだありません。</p>}</div></div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Braces; label: string; value: number | string; detail: string }) { return <div className="rounded-3xl border border-[#dfddd5] bg-[#fffefb] p-6 shadow-[0_12px_26px_rgba(38,57,80,0.05)]"><Icon className="h-5 w-5 text-[#526b88]" /><p className="mt-7 font-mono-editor text-[10px] uppercase tracking-[0.14em] text-[#78808d]">{label}</p><p className="mt-1 text-3xl font-bold text-[#27394f]">{value}</p><p className="mt-1 text-xs text-[#858b94]">{detail}</p></div>; }
function EmptyPrompt({ onCreate }: { onCreate: () => void }) { return <div className="py-10 text-center"><p className="text-sm text-[#777d88]">最初のデバッグノートを記録しましょう。</p><button onClick={onCreate} className="mt-3 text-xs font-bold text-[#344c69] hover:underline">CREATE ARTICLE</button></div>; }
