import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Loader2, Plus, Search, Upload } from 'lucide-react';

import { useAuth } from '@/common/hooks/useAuth';
import { useProfile } from '@/common/context/ProfileContext';
import { getResources, uploadResource, type UploadResourcePayload } from '@/api/client';
import type { ResourceItem } from '@/types';

const ResourceHub: React.FC = () => {
  const { idToken } = useAuth();
  const { refetchProfile } = useProfile();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    title: '',
    subject: '',
    chapter: '',
    url: '',
    description: '',
    tagsInput: '',
  });

  const loadResources = useCallback(async () => {
    if (!idToken) return;
    setLoading(true);
    setError(null);
    try {
      const { resources: rows } = await getResources(idToken, {
        subject: subjectFilter || undefined,
        chapter: chapterFilter || undefined,
        limit: 40,
      });
      setResources(rows);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch the resource library. Please retry shortly.');
    } finally {
      setLoading(false);
    }
  }, [chapterFilter, idToken, subjectFilter]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((resource) => set.add(resource.subject));
    return Array.from(set).sort();
  }, [resources]);

  const chapters = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((resource) => {
      const label = resource.chapter || resource.topic;
      if (label) {
        set.add(label);
      }
    });
    return Array.from(set).sort();
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (!query) return resources;
    const search = query.toLowerCase();
    return resources.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        item.subject.toLowerCase().includes(search) ||
        (item.topic ?? '').toLowerCase().includes(search) ||
        (item.chapter ?? '').toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search),
    );
  }, [resources, query]);

  const handleUpload = async () => {
    if (!idToken || !draft.title.trim() || !draft.subject.trim() || !draft.url.trim()) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const tags = draft.tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      const payload: UploadResourcePayload = {
        title: draft.title.trim(),
        subject: draft.subject.trim(),
        chapter: draft.chapter.trim() || undefined,
        url: draft.url.trim(),
        description: draft.description?.trim() || undefined,
        tags: tags.length ? tags : undefined,
      };
      const saved = await uploadResource(idToken, payload);
      setResources((prev) => [saved, ...prev]);
      void refetchProfile();
      setDraft({
        title: '',
        subject: '',
        chapter: '',
        url: '',
        description: '',
        tagsInput: '',
      });
    } catch (err) {
      console.error(err);
      setError('Unable to upload the resource. Please verify the link and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="glass-panel space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Resource Library</p>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Shared Notes & PDF Drop</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Search peer-uploaded guides, download vetted notes, or contribute your own links until storage uploads arrive.
        </p>
      </div>

      <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Upload className="h-4 w-4" />
          Share a resource
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Title
            <input
              type="text"
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="eg. Calculus Revision Guide"
              className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Subject
            <input
              type="text"
              value={draft.subject}
              onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
              placeholder="Mathematics"
              className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Chapter / Unit
            <input
              type="text"
              value={draft.chapter}
              onChange={(event) => setDraft((prev) => ({ ...prev, chapter: event.target.value }))}
              placeholder="Chapter 4 • Derivatives"
              className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            URL
            <input
              type="url"
              value={draft.url}
              onChange={(event) => setDraft((prev) => ({ ...prev, url: event.target.value }))}
              placeholder="https://drive.google.com/..."
              className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
          </label>
        </div>
        <textarea
          value={draft.description}
          onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
          rows={3}
          placeholder="What does this PDF cover? Any special instructions?"
          className="w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
        />
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Tags (comma separated)
          <input
            type="text"
            value={draft.tagsInput}
            onChange={(event) => setDraft((prev) => ({ ...prev, tagsInput: event.target.value }))}
            placeholder="board exam, grade 12, calculus"
            className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isSaving || !draft.title.trim() || !draft.subject.trim() || !draft.url.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Upload link
          </button>
        </div>
      </div>

      <div className="glass-panel space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[var(--border-subtle)] px-3 py-2">
              <Search className="h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search subjects, chapters, or tags"
                className="w-full bg-transparent text-sm text-[var(--text-primary)] focus:outline-none"
              />
            </div>
            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <select
              value={chapterFilter}
              onChange={(event) => setChapterFilter(event.target.value)}
              className="rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            >
              <option value="">All chapters</option>
              {chapters.map((chapter) => (
                <option key={chapter} value={chapter}>
                  {chapter}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => void loadResources()}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          >
            <BookOpen className="h-4 w-4" />
            Refresh library
          </button>
        </div>

        {error && <p className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-[var(--text-muted)]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading resources...
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 p-8 text-center text-sm text-[var(--text-secondary)]">
            No uploads match that filter. Try a different subject or share a new link.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredResources.map((resource) => (
              <article key={resource.id} className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">{resource.subject}</p>
                    <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{resource.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{resource.chapter ?? resource.topic}</p>
                  </div>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-[var(--accent-primary)] px-3 py-1 text-xs font-semibold text-[var(--accent-primary)] transition hover:bg-[var(--accent-primary)]/10"
                  >
                    Open PDF
                  </a>
                </div>
                {resource.description && (
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">{resource.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="rounded-full border border-[var(--border-subtle)] px-3 py-1">Uploaded by {resource.createdByName}</span>
                  {resource.tags?.map((tag) => (
                    <span key={tag} className="rounded-full border border-[var(--border-subtle)] px-3 py-1">
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ResourceHub;
