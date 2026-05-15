type SearchInputProps = {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
};

export function SearchInput({
  name = "q",
  defaultValue,
  placeholder = "検索キーワード",
}: SearchInputProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Search
      </span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
      />
    </label>
  );
}
