import ReactMarkdown from "react-markdown";
import sanitizeHtml from "sanitize-html";

function getYoutubeEmbedUrl(input?: string | null) {
  if (!input) return null;
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    }
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function ContentBody({
  contentType,
  content,
}: {
  contentType: string;
  content: string | null;
}) {
  if (contentType === "VIDEO") {
    const embed = getYoutubeEmbedUrl(content);
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Video</h2>
        {embed ? (
          <div className="aspect-video overflow-hidden rounded-xl border border-slate-200">
            <iframe
              src={embed}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : (
          <p className="text-sm text-slate-600">動画URLが設定されていません。</p>
        )}
      </section>
    );
  }

  if (contentType === "TASK") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Task</h2>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap">
          {content || "タスク内容はまだありません。"}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <article className="prose prose-slate max-w-none text-sm leading-7">
        <ReactMarkdown>{sanitizeHtml(content || "")}</ReactMarkdown>
      </article>
    </section>
  );
}
