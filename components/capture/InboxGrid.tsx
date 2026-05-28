import { ContentItem } from "@prisma/client";
import { ContentCard } from "./ContentCard";

export function InboxGrid({ items }: { items: ContentItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}
