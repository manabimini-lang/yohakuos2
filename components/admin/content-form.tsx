"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ContentLayer,
  ContentType,
  ContentVisibility,
  PublishStatus,
} from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  createContentAction,
  type CreateContentActionResult,
} from "@/lib/actions/content/create-content";
import {
  createContentSchema,
  type CreateContentInput,
} from "@/lib/validations/content";

type TagOption = {
  id: string;
  name: string;
  slug: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type ContentFormProps = {
  tags: TagOption[];
  initialValues?: CreateContentInput;
  submitLabel?: string;
  onSubmitAction?: (values: CreateContentInput) => Promise<CreateContentActionResult>;
};

export function ContentForm({
  tags,
  initialValues,
  submitLabel = "Create Content",
  onSubmitAction = createContentAction,
}: ContentFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const defaultValues = useMemo<CreateContentInput>(
    () => ({
      title: "",
      slug: "",
      description: "",
      thumbnailUrl: "",
      content: "",
      contentType: ContentType.ARTICLE,
      visibility: ContentVisibility.FREE,
      publishStatus: PublishStatus.DRAFT,
      layer: ContentLayer.BEGINNER,
      releaseDate: "",
      tagIds: [],
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateContentInput>({
    resolver: zodResolver(createContentSchema),
    defaultValues: initialValues ?? defaultValues,
  });

  const title = watch("title");

  useEffect(() => {
    if (!slugEdited) {
      setValue("slug", slugify(title), { shouldValidate: true });
    }
  }, [title, slugEdited, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setIsSubmitting(true);

    const result: CreateContentActionResult = await onSubmitAction(values);

    if (result.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        if (!message) continue;
        setError(field as keyof CreateContentInput, { message });
      }
    }
    if (result.error) {
      setServerError(result.error);
    }

    setIsSubmitting(false);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">title *</span>
          <input
            {...register("title")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            placeholder="Hello World"
          />
          {errors.title?.message ? (
            <p className="text-xs text-rose-600">{errors.title.message}</p>
          ) : null}
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">slug *</span>
          <input
            {...register("slug")}
            onChange={(e) => {
              setSlugEdited(true);
              setValue("slug", e.target.value, { shouldValidate: true });
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            placeholder="hello-world"
          />
          {errors.slug?.message ? (
            <p className="text-xs text-rose-600">{errors.slug.message}</p>
          ) : null}
        </label>
      </div>

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-slate-700">description</span>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-slate-700">thumbnail_url</span>
        <input
          {...register("thumbnailUrl")}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          placeholder="https://..."
        />
        {errors.thumbnailUrl?.message ? (
          <p className="text-xs text-rose-600">{errors.thumbnailUrl.message}</p>
        ) : null}
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-slate-700">content</span>
        <textarea
          {...register("content")}
          rows={10}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          placeholder="Write content..."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">content_type *</span>
          <select
            {...register("contentType")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {Object.values(ContentType).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          {errors.contentType?.message ? (
            <p className="text-xs text-rose-600">{errors.contentType.message}</p>
          ) : null}
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">visibility</span>
          <select
            {...register("visibility")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {Object.values(ContentVisibility).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">publish_status</span>
          <select
            {...register("publishStatus")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {Object.values(PublishStatus).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">layer</span>
          <select
            {...register("layer")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {Object.values(ContentLayer).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">release_date</span>
          <input
            type="date"
            {...register("releaseDate")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-700">tags</span>
          <select
            multiple
            {...register("tagIds")}
            className="h-28 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name} ({tag.slug})
              </option>
            ))}
          </select>
        </label>
      </div>

      {serverError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {serverError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
