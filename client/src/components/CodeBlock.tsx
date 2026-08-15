type CodeBlockProps = { code: string; language: string; className?: string };

const KEYWORDS = /\b(public|private|protected|class|interface|extends|implements|static|final|void|new|return|if|else|for|while|try|catch|throw|throws|import|package|const|let|function|async|await|def|from|select|where|join|insert|update|delete|true|false|null|undefined)\b/g;
const TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|\b(?:public|private|protected|class|interface|extends|implements|static|final|void|new|return|if|else|for|while|try|catch|throw|throws|import|package|const|let|function|async|await|def|from|select|where|join|insert|update|delete|true|false|null|undefined)\b)/g;

export const LANGUAGE_KEYWORDS: Record<string, RegExp> = {
  Java: /^(public|private|protected|class|interface|extends|implements|static|final|void|new|return|try|catch|throw|throws|import|package|true|false|null)$/,
  Kotlin: /^(class|fun|val|var|object|data|when|return|suspend|coroutine|true|false|null)$/,
  TypeScript: /^(const|let|function|async|await|interface|type|export|import|return|new|true|false|null|undefined)$/,
  JavaScript: /^(const|let|function|async|await|export|import|return|new|true|false|null|undefined)$/,
  Python: /^(def|class|from|import|return|if|else|for|while|try|except|True|False|None)$/,
  SQL: /^(SELECT|FROM|WHERE|JOIN|INSERT|UPDATE|DELETE|CREATE|ALTER|GROUP|ORDER|BY|VALUES)$/i,
  Bash: /^(if|then|fi|for|in|do|done|case|esac|function|export)$/,
};

export default function CodeBlock({ code, language, className = "" }: CodeBlockProps) {
  const chunks = code.split(TOKEN);
  const keywordPattern = LANGUAGE_KEYWORDS[language] ?? /$a/;
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-800 bg-[#17212e] shadow-[0_12px_30px_rgba(13,27,42,0.16)] ${className}`}>
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
        <span className="font-mono-editor text-[10px] uppercase tracking-[0.16em] text-slate-300">{language}</span>
        <span className="flex gap-1.5" aria-hidden="true"><i className="h-2 w-2 rounded-full bg-rose-300/80" /><i className="h-2 w-2 rounded-full bg-amber-200/80" /><i className="h-2 w-2 rounded-full bg-emerald-300/80" /></span>
      </div>
      <pre className="overflow-x-auto p-5 font-mono-editor text-[12px] leading-6 text-slate-100">
        <code>{chunks.map((part, index) => {
          if (!part) return null;
          const isComment = /^(\/\/|\/\*|#)/.test(part);
          const isString = /^("|')/.test(part);
          const isNumber = /^\d/.test(part);
          const isKeyword = keywordPattern.test(part);
          KEYWORDS.lastIndex = 0;
          const color = isComment ? "text-slate-500" : isString ? "text-emerald-300" : isNumber ? "text-amber-200" : isKeyword ? "text-violet-300" : "";
          return <span className={color} key={`${index}-${part.slice(0, 8)}`}>{part}</span>;
        })}</code>
      </pre>
    </div>
  );
}
