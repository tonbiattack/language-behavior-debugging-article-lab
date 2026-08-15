import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";

export default function Articles() {
  const [, setLocation] = useLocation();
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ query: "", language: "", category: "", tag: "" });
  const catalog = trpc.catalog.options.useQuery();
  const articles = trpc.articles.list.useQuery(filters);
  const activeFilters = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setFilters(current => ({ ...current, query: searchInput.trim() }));
  }

  return <div className="min-h-full px-6 py-8 md:px-10 md:py-10"><div className="mx-auto max-w-7xl">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="font-mono-editor text-[10px] uppercase tracking-[0.18em] text-[#747b87]">Knowledge library</p><h1 className="font-display mt-1 text-4xl text-[#24364b]">A well-indexed memory.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#707784]">症状、仮説、検証コード、解決策を一箇所で検索し、次の障害対応を速くします。</p></div><Button onClick={() => setLocation("/articles/new")} className="rounded-xl bg-[#263950] text-white hover:bg-[#1d2e43]"><Plus className="mr-1.5 h-4 w-4" />New article</Button></div>
    <div className="mt-8 rounded-3xl border border-[#dfddd5] bg-[#fffefb] p-4 shadow-[0_12px_26px_rgba(38,57,80,0.05)] md:p-5"><form onSubmit={submit} className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#858c98]" /><Input value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="タイトル、本文、タグを検索" className="h-11 rounded-xl border-[#deddd6] bg-[#fbfaf7] pl-10 shadow-none" /></div><Button type="submit" className="h-11 rounded-xl bg-[#334b69] text-white hover:bg-[#263950]">Search</Button></form><div className="mt-4 grid gap-3 sm:grid-cols-3"><FilterSelect label="言語" value={filters.language} options={catalog.data?.languages ?? []} onChange={language => setFilters(current => ({ ...current, language }))} /><FilterSelect label="カテゴリ" value={filters.category} options={catalog.data?.categories ?? []} onChange={category => setFilters(current => ({ ...current, category }))} /><FilterSelect label="タグ" value={filters.tag} options={catalog.data?.tags ?? []} onChange={tag => setFilters(current => ({ ...current, tag }))} /></div>{activeFilters > 0 && <button className="mt-4 text-xs font-bold text-[#506886] hover:underline" onClick={() => { setSearchInput(""); setFilters({ query: "", language: "", category: "", tag: "" }); }}>RESET {activeFilters} FILTERS</button>}</div>
    <div className="mt-7 flex items-center justify-between"><p className="font-mono-editor text-[10px] uppercase tracking-[0.15em] text-[#777e8a]">{articles.data?.length ?? 0} records found</p><SlidersHorizontal className="h-4 w-4 text-[#78808d]" /></div>
    <div className="mt-3 grid gap-4 lg:grid-cols-2">{articles.isLoading ? Array.from({ length: 4 }).map((_, index) => <div className="h-52 animate-pulse rounded-3xl bg-[#e8e7e1]" key={index} />) : articles.isError ? <ErrorState onRetry={() => articles.refetch()} /> : articles.data?.length ? articles.data.map(article => <button onClick={() => setLocation(`/articles/${article.id}`)} key={article.id} className="group rounded-3xl border border-[#dfddd5] bg-[#fffefb] p-6 text-left shadow-[0_12px_26px_rgba(38,57,80,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#aeb9c5] hover:shadow-[0_16px_34px_rgba(38,57,80,0.1)]"><div className="flex items-start justify-between gap-3"><div className="flex gap-2"><Badge variant="outline" className="border-[#d7dcd7] bg-[#f5f6f2] text-[10px] font-bold text-[#506886]">{article.language}</Badge><Badge variant="outline" className="border-[#e3d7b9] bg-[#faf7ef] text-[10px] font-bold text-[#a07635]">{article.category}</Badge></div><span className="font-mono-editor text-[10px] text-[#8b9099]">#{String(article.id).padStart(3, "0")}</span></div><h2 className="mt-5 text-lg font-bold leading-snug text-[#293b51] group-hover:text-[#355577]">{article.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#747b86]">{article.content}</p><div className="mt-5 flex flex-wrap gap-1.5">{article.tags.length ? article.tags.map(tag => <span key={tag} className="rounded-md bg-[#eff1ee] px-2 py-1 text-[10px] font-semibold text-[#657181]">#{tag}</span>) : <span className="text-xs text-[#969ba3]">タグなし</span>}</div></button>) : <EmptyState />}</div>
  </div></div>;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) { return <label className="flex items-center gap-3 rounded-xl border border-[#e2e0d9] bg-[#fbfaf7] px-3"><span className="text-xs font-bold text-[#74808d]">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="h-9 min-w-0 flex-1 bg-transparent text-sm text-[#354a63] outline-none"><option value="">すべて</option>{options.map(option => <option value={option} key={option}>{option}</option>)}</select></label>; }
function EmptyState() { return <div className="col-span-full rounded-3xl border border-dashed border-[#cfd1ca] py-16 text-center"><p className="font-display text-2xl text-[#40526a]">No notes match this view.</p><p className="mt-2 text-sm text-[#7a818c]">フィルターを解除するか、新しい記事を作成してください。</p></div>; }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <div className="col-span-full rounded-3xl border border-[#edd4cf] bg-[#fff9f7] px-6 py-16 text-center"><p className="font-display text-2xl text-[#7d4a46]">The index is unavailable.</p><p className="mt-2 text-sm text-[#8a6a66]">一覧の取得に失敗しました。接続を確認してもう一度お試しください。</p><button className="mt-4 text-xs font-bold text-[#9a514c] hover:underline" onClick={onRetry}>RETRY</button></div>; }
