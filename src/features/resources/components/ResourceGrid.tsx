import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Search, Upload } from 'lucide-react';

import { useAuth } from '@/common/hooks/useAuth';
import { useProfile } from '@/common/context/ProfileContext';
import { getResources, uploadResource, type UploadResourcePayload } from '@/api/client';
import type { ResourceItem } from '@/types';

const ResourceGrid: React.FC = () => {
  const { idToken } = useAuth();
  const { refetchProfile } = useProfile();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    subject: '',
    topic: '',
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
        limit: 40,
      });
      setResources(rows);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch the resource library. Please retry shortly.');
    } finally {
      setLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const filteredResources = useMemo(() => {
    if (!query) return resources;
    const search = query.toLowerCase();
    return resources.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        item.subject.toLowerCase().includes(search) ||
        (item.topic ?? '').toLowerCase().includes(search) ||
        (item.chapter ?? '').toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.tags?.some(tag => tag.toLowerCase().includes(search)),
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
        topic: draft.topic.trim() || undefined,
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
        topic: '',
        url: '',
        description: '',
        tagsInput: '',
      });
      setShowUploadModal(false);
    } catch (err) {
      console.error(err);
      setError('Unable to upload the resource. Please verify the link and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getPrimaryTag = (resource: ResourceItem): string => {
    if (resource.tags && resource.tags.length > 0) {
      return resource.tags[0];
    }
    return resource.subject;
  };

  if (!idToken) {
    return (
      <section className="glass-panel">
        <p className="text-sm text-[var(--text-secondary)]">
          Sign in to view the resource library.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Resource Library</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Study materials shared by your peers
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
        >
          <Upload className="h-4 w-4" />
          Share Resource
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 px-4 py-2">
        <Search className="h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, subject, topic, or tags..."
          className="w-full bg-transparent text-sm text-[var(--text-primary)] focus:outline-none"
        />
      </div>

      {error && <p className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {/* Resource Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading resources...
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No resources found</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {query ? 'Try adjusting your search terms.' : 'Be the first to share a study resource!'}
          </p>
          {!query && (
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
            >
              <Upload className="h-4 w-4" />
              Share Resource
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredResources.map((resource) => (
            <article
              key={resource.id}
              className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--accent-primary)] hover:shadow-lg"
            >
              <div className="flex flex-col h-full">
                {/* PDF Icon and Tag */}
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-xl bg-red-100 p-2">
                    <FileText className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="rounded-full bg-[var(--accent-primary)]/10 px-2 py-1 text-xs font-medium text-[var(--accent-primary)]">
                    {getPrimaryTag(resource)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-[var(--text-primary)] mb-2 line-clamp-2">
                  {resource.title}
                </h3>

                {/* Subject/Topic */}
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  {resource.subject}
                  {resource.topic && ` • ${resource.topic}`}
                </p>

                {/* Description */}
                {resource.description && (
                  <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2 flex-grow">
                    {resource.description}
                  </p>
                )}

                {/* Action Button */}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto w-full inline-flex items-center justify-center rounded-xl border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--accent-primary)]/90 hover:shadow-md"
                >
                  Open Resource
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Share Resource</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Title
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="e.g. Calculus Revision Guide"
                  className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </label>

              <div className="grid gap-4 grid-cols-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Subject
                  <input
                    type="text"
                    value={draft.subject}
                    onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
                    placeholder="Mathematics"
                    className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Topic
                  <input
                    type="text"
                    value={draft.topic}
                    onChange={(event) => setDraft((prev) => ({ ...prev, topic: event.target.value }))}
                    placeholder="Derivatives"
                    className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                URL
                <input
                  type="url"
                  value={draft.url}
                  onChange={(event) => setDraft((prev) => ({ ...prev, url: event.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Description (optional)
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                  rows={2}
                  placeholder="Brief description of the resource..."
                  className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Tags (comma separated)
                <input
                  type="text"
                  value={draft.tagsInput}
                  onChange={(event) => setDraft((prev) => ({ ...prev, tagsInput: event.target.value }))}
                  placeholder="exam prep, grade 12, calculus"
                  className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 rounded-2xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isSaving || !draft.title.trim() || !draft.subject.trim() || !draft.url.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ResourceGrid;
