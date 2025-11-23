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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Resources</h1>
          <p className="text-[var(--text-secondary)]">Study materials shared by the community</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Share Resource
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] w-4 h-4" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resources..."
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Resource Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[var(--accent-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-[var(--accent-primary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {query ? 'No resources found' : 'No resources yet'}
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            {query ? 'Try a different search term' : 'Be the first to share a study resource!'}
          </p>
          {!query && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white px-6 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Share Resource
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <article
              key={resource.id}
              className="group bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 hover:border-[var(--accent-primary)] hover:shadow-lg transition-all duration-200"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs font-medium rounded-full">
                      {getPrimaryTag(resource)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 mb-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2 line-clamp-2 text-lg">
                    {resource.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-3">
                    <span className="font-medium">{resource.subject}</span>
                    {resource.topic && (
                      <>
                        <span>•</span>
                        <span>{resource.topic}</span>
                      </>
                    )}
                  </div>

                  {resource.description && (
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-3">
                      {resource.description}
                    </p>
                  )}
                </div>

                {/* Action */}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white py-3 px-4 rounded-xl font-semibold text-sm text-center transition-colors flex items-center justify-center gap-2 group"
                >
                  Open Resource
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg border border-[var(--border-subtle)] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">Share Resource</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Resource Title
                  </label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="e.g. Advanced Calculus Study Guide"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={draft.subject}
                      onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
                      placeholder="Mathematics"
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={draft.topic}
                      onChange={(event) => setDraft((prev) => ({ ...prev, topic: event.target.value }))}
                      placeholder="Calculus, Algebra..."
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Resource URL
                  </label>
                  <input
                    type="url"
                    value={draft.url}
                    onChange={(event) => setDraft((prev) => ({ ...prev, url: event.target.value }))}
                    placeholder="https://drive.google.com/file/d/... or https://..."
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={draft.description}
                    onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                    rows={3}
                    placeholder="Brief description of what this resource covers..."
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Tags (Optional)
                  </label>
                  <input
                    type="text"
                    value={draft.tagsInput}
                    onChange={(event) => setDraft((prev) => ({ ...prev, tagsInput: event.target.value }))}
                    placeholder="exam prep, grade 12, calculus, pdf"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">Separate tags with commas</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isSaving || !draft.title.trim() || !draft.subject.trim() || !draft.url.trim()}
                  className="px-6 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Share Resource
                    </>
                  )}
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
