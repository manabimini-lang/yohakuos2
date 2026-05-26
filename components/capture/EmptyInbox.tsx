export function EmptyInbox() {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-sm text-notion-text dark:text-gray-300 mb-2 font-medium">まだ余白はありません。</p>
      <p className="text-sm text-gray-500 leading-relaxed">
        あとで意味になる記録を、<br />
        静かに置いていきましょう。
      </p>
    </div>
  );
}
