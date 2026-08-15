import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

type FormState = { title: string; content: string; codeSnippet: string; language: string; category: string; status: "draft" | "published"; tags: string };
const initialForm: FormState = { title: "", content: "", codeSnippet: "", language: "Java", category: "Runtime", status: "published", tags: "" };

export default function ArticleEditor() {
  const [, params] = useRoute("/articles/:id/edit");
  const articleId = params?.id ? Number(params.id) : null;
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const catalog = trpc.catalog.options.useQuery();
  const article = trpc.articles.get.useQuery({ id: articleId ?? 1 }, { enabled: Boolean(articleId) });
  const utils = trpc.useUtils();
  const [form, setForm] = useState<FormState>(initialForm);
  useEffect(() => {
    if (article.data) setForm({ title: article.data.title, content: article.data.content, codeSnippet: article.data.codeSnippet ?? "", language: article.data.language, category: article.data.category, status: article.data.status, tags: article.data.tags.join(", ") });
  }, [article.data]);
  const createArticle = trpc.articles.create.useMutation({ onSuccess: saved => { utils.articles.invalidate(); toast.success("記事を保存しました。"); if (saved) setLocation(`/articles/${saved.id}`); }, onError: error => toast.error(error.message) });
  const updateArticle = trpc.articles.update.useMutation({ onSuccess: saved => { utils.articles.invalidate(); toast.success("記事を更新しました。"); setLocation(`/articles/${saved?.id ?? articleId}`); }, onError: error => toast.error(error.message) });
  const remove = trpc.articles.remove.useMutation({ onSuccess: () => { utils.articles.invalidate(); toast.success("記事を削除しました。"); setLocation("/articles"); }, onError: error => toast.error(error.message) });
  const payload = () => ({ ...form, tags: form.tags.split(",").map(tag => tag.trim()).filter(Boolean) });
  function submit(event: FormEvent) { event.preventDefault(); if (!isAuthenticated) { startLogin(); return; } if (!form.title.trim() || !form.content.trim()) { toast.error("タイトルと本文を入力してください。"); return; } if (articleId) updateArticle.mutate({ id: articleId, draft: payload() }); else createArticle.mutate(payload()); }
  const saving = createArticle.isPending || updateArticle.isPending;
  return <div className="min-h-full px-6 py-8 md:px-10 md:py-10"><form onSubmit={submit} className="mx-auto max-w-5xl"><div className="flex items-center justify-between gap-4"><button type="button" onClick={() => setLocation(articleId ? `/articles/${articleId}` : "/articles")} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#60738c] hover:text-[#283d56]"><ArrowLeft className="h-4 w-4" />BACK TO LIBRARY</button><div className="flex items-center gap-2">{articleId && <Button type="button" variant="outline" onClick={() => remove.mutate({ id: articleId })} disabled={remove.isPending} className="rounded-xl border-[#e4c9c6] text-[#a44e48] hover:bg-[#fdf4f2]"><Trash2 className="mr-1.5 h-4 w-4" />Delete</Button>}<Button type="submit" disabled={saving} className="rounded-xl bg-[#263950] text-white hover:bg-[#1d2e43]"><Save className="mr-1.5 h-4 w-4" />{saving ? "Saving…" : articleId ? "Update article" : "Save article"}</Button></div></div><div className="mt-7 overflow-hidden rounded-3xl border border-[#dfddd5] bg-[#fffefb] shadow-[0_12px_26px_rgba(38,57,80,0.05)]"><div className="border-b border-[#e4e1d9] bg-[#fcfbf8] px-6 py-5"><p className="font-mono-editor text-[10px] uppercase tracking-[0.16em] text-[#7a818c]">{articleId ? "Refine knowledge" : "Capture an insight"}</p><h1 className="font-display mt-1 text-3xl text-[#263950]">{articleId ? "Edit the diagnostic trail." : "Turn a fix into a reusable note."}</h1></div><div className="grid gap-5 p-6 md:grid-cols-2"><Field label="Title" className="md:col-span-2"><Input value={form.title} maxLength={240} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="例: Spring Bootで発生したRedis接続プール枯渇の切り分け" className="h-12 rounded-xl bg-[#fdfcf9]" /></Field><SelectField label="Language" value={form.language} options={catalog.data?.languages ?? ["Java"]} onChange={language => setForm({ ...form, language })} /><SelectField label="Debug category" value={form.category} options={catalog.data?.categories ?? ["Runtime"]} onChange={category => setForm({ ...form, category })} /><Field label="Tags"><Input value={form.tags} onChange={event => setForm({ ...form, tags: event.target.value })} placeholder="redis, lettuce, pooling（カンマ区切り）" className="h-12 rounded-xl bg-[#fdfcf9]" /></Field><SelectField label="Publishing state" value={form.status} options={["published", "draft"]} onChange={status => setForm({ ...form, status: status as FormState["status"] })} /><Field label="Diagnostic narrative" className="md:col-span-2"><Textarea value={form.content} onChange={event => setForm({ ...form, content: event.target.value })} placeholder="症状、原因仮説、検証手順、解決策を記録します。" className="min-h-56 resize-y rounded-xl bg-[#fdfcf9] leading-7" /></Field><Field label="Code snippet" className="md:col-span-2"><Textarea value={form.codeSnippet} onChange={event => setForm({ ...form, codeSnippet: event.target.value })} placeholder="再現・検証に使用したコードを貼り付けます。" className="font-mono-editor min-h-48 resize-y rounded-xl bg-[#17212e] text-sm leading-6 text-slate-100 placeholder:text-slate-500" /></Field></div></div></form></div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`block ${className}`}><span className="mb-2 block text-xs font-bold text-[#4b5c70]">{label}</span>{children}</label>; }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) { return <label className="block"><span className="mb-2 block text-xs font-bold text-[#4b5c70]">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-[#fdfcf9] px-3 text-sm text-[#354a63] outline-none focus:ring-2 focus:ring-ring/50">{options.map(option => <option value={option} key={option}>{option}</option>)}</select></label>; }
