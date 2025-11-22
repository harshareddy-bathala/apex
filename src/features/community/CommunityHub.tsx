import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowBigUp, Filter, Loader2, MessageCircle, Send, ShieldCheck, Tag } from 'lucide-react';

import { useAuth } from '@/common/hooks/useAuth';
import { createCommunityPost, getCommunityFeed, toggleCommunityUpvote } from '@/api/client';
import type { CommunityPost } from '@/types';

const MAX_POST_LENGTH = 480;

const CommunityHub: React.FC = () => {
  const { idToken } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ subject: '', content: '', tags: '' });
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  const subjectOptions = useMemo(() => {
    const subjects = new Set<string>();
    posts.forEach((post) => {
      if (post.subject) subjects.add(post.subject);
    });
    return Array.from(subjects).sort();
  }, [posts]);

  const loadFeed = useCallback(async () => {
    if (!idToken) return;
    setLoading(true);
    setError(null);
    try {
      const { posts: feed } = await getCommunityFeed(idToken, {
        subject: filterSubject || undefined,
        query: searchTerm || undefined,
        limit: 40,
      });
      setPosts(feed);
    } catch (err) {
      console.error(err);
      setError('Unable to load the community feed right now. Please try again soon.');
    } finally {
      setLoading(false);
    }
  }, [filterSubject, searchTerm, idToken]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const handlePublish = async () => {
    if (!idToken || !draft.content.trim()) {
      return;
    }
    setIsPublishing(true);
    setError(null);
    try {
      const tags = draft.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 4);

      const newPost = await createCommunityPost(idToken, {
        content: draft.content.trim(),
        subject: draft.subject.trim() || undefined,
        tags,
      });
      setPosts((prev) => [newPost, ...prev]);
      setDraft({ subject: '', content: '', tags: '' });
    } catch (err) {
      console.error(err);
      setError('Unable to publish your question right now. Please retry in a moment.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReplySubmit = async (postId: string) => {
    if (!idToken) return;
    const content = replyDrafts[postId]?.trim();
    if (!content) return;
    try {
      const reply = await createCommunityPost(idToken, { content, parentId: postId });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                replyCount: post.replyCount + 1,
                replies: [reply, ...(post.replies ?? [])],
              }
            : post,
        ),
      );
      setReplyDrafts((prev) => ({ ...prev, [postId]: '' }));
      setExpandedReplies((prev) => ({ ...prev, [postId]: true }));
    } catch (err) {
      console.error(err);
      setError('Unable to reply right now. Please retry.');
    }
  };

  const handleUpvote = async (postId: string) => {
    if (!idToken) return;
    try {
      const updated = await toggleCommunityUpvote(idToken, postId);
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === updated.id) {
            return updated;
          }
          if (post.replies) {
            return {
              ...post,
              replies: post.replies?.map((reply) => (reply.id === updated.id ? updated : reply)),
            };
          }
          return post;
        }),
      );
    } catch (err) {
      console.error(err);
      setError('Unable to update the upvote count. Please retry.');
    }
  };

  const filteredPosts = useMemo(() => {
    if (!searchTerm) return posts;
    const query = searchTerm.toLowerCase();
    return posts.filter(
      (post) =>
        post.content.toLowerCase().includes(query) ||
        (post.subject ?? '').toLowerCase().includes(query) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(query)),
    );
  }, [posts, searchTerm]);

  const renderReplies = (post: CommunityPost) => {
    if (!post.replies || post.replies.length === 0) {
      return null;
    }
    const isExpanded = expandedReplies[post.id];
    const replies = isExpanded ? post.replies : post.replies.slice(0, 2);

    return (
      <div className="mt-4 space-y-3 border-t border-[var(--border-subtle)] pt-4">
        {replies.map((reply) => {
          const isTeacher = reply.authorRole === 'teacher' || reply.isTeacher;
          return (
            <div
              key={reply.id}
              className={`rounded-2xl border px-4 py-3 ${
                isTeacher
                  ? 'border-[var(--accent-primary)]/60 bg-[var(--accent-primary)]/5'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  {reply.authorName}
                  {isTeacher && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-primary)]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
                      <ShieldCheck size={12} />
                      Teacher
                    </span>
                  )}
                </div>
                <span>{formatRelativeTime(reply.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-primary)] whitespace-pre-wrap">{reply.content}</p>
            </div>
          );
        })}
        {post.replies.length > 2 && (
          <button
            type="button"
            className="text-xs font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-hover)]"
            onClick={() => setExpandedReplies((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
          >
            {isExpanded ? 'Hide replies' : `Show all ${post.replyCount} replies`}
          </button>
        )}
      </div>
    );
  };

  if (!idToken) {
    return (
      <section className="glass-panel">
        <p className="text-sm text-[var(--text-secondary)]">
          Sign in to view the community discussion board.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="glass-panel space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Community Feed</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Ask peers & mentors anything</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Post a question, share a study tip, or trade resources. Replies stay threaded for clarity.
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Subject / Topic
              <input
                type="text"
                value={draft.subject}
                onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value.slice(0, 48) }))}
                className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                placeholder="eg. Calculus, Mental Health"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Tags (comma separated)
              <input
                type="text"
                value={draft.tags}
                onChange={(event) => setDraft((prev) => ({ ...prev, tags: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                placeholder="exam prep, grade 10, physics"
              />
            </label>
          </div>
          <textarea
            value={draft.content}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                content: event.target.value.slice(0, MAX_POST_LENGTH),
              }))
            }
            rows={3}
            className="w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            placeholder="Ask a question or share a learning win..."
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-[var(--text-muted)]">{draft.content.length}/{MAX_POST_LENGTH} characters</span>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing || !draft.content.trim()}
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent-primary)] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Share update
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--text-muted)]" />
              <select
                value={filterSubject}
                onChange={(event) => setFilterSubject(event.target.value)}
                className="rounded-2xl border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              >
                <option value="">All subjects</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search posts or hashtags"
              className="rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadFeed()}
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          >
            Refresh
          </button>
        </div>

        {error && <p className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading posts...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 p-8 text-center text-sm text-[var(--text-secondary)]">
            No discussions yet. Be the first to ask a question!
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/70 p-5 transition hover:border-[var(--border-strong)]"
              >
                <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">{post.authorName}</span>
                  {post.authorRole === 'teacher' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-primary)]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-primary)]">
                      <ShieldCheck size={12} />
                      Teacher
                    </span>
                  )}
                  <span>•</span>
                  <span>{formatRelativeTime(post.createdAt)}</span>
                    {post.subject && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[var(--text-secondary)]">
                          <Tag className="h-3 w-3" />
                          {post.subject}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-[var(--text-primary)]">{post.content}</p>
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                    {post.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white/5 px-3 py-1">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => handleUpvote(post.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
                      post.hasUpvoted
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]'
                    }`}
                  >
                    <ArrowBigUp className="h-4 w-4" />
                    {post.upvoteCount}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedReplies((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[var(--text-secondary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {post.replyCount} replies
                  </button>
                </div>

                {expandedReplies[post.id] && (
                  <div className="mt-3">
                    <textarea
                      value={replyDrafts[post.id] ?? ''}
                      onChange={(event) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [post.id]: event.target.value.slice(0, 320),
                        }))
                      }
                      rows={2}
                      placeholder="Share a quick reply..."
                      className="w-full rounded-2xl border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleReplySubmit(post.id)}
                        disabled={!replyDrafts[post.id]?.trim()}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}

                {renderReplies(post)}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export default CommunityHub;
