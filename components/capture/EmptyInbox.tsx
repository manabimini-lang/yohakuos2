export function EmptyInbox({ itemCount = 0 }: { itemCount?: number }) {
  const remaining = Math.max(0, 20 - itemCount);

  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-sm text-foreground mb-2 font-medium">まずはひとつ、気になったことを記録してみてください。</p>
      <p className="text-sm text-muted-foreground leading-relaxed mt-4">
        5件たまると、最近よく出てくるテーマを表示します。
        <br />
        {remaining > 0 ? `あと${remaining}件で、AIが記録のつながりを提案します。` : "AIが記録のつながりや次の一歩を提案します。"}
      </p>
    </div>
  );
}
