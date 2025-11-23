import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Plus, Repeat2, Search, X } from 'lucide-react';

import { useAuth } from '@/common/hooks/useAuth';
import { createCommunityPost, getCommunityFeed, toggleCommunityUpvote } from '@/api/client';
import type { CommunityPost } from '@/types';

const MAX_POST_LENGTH = 280;

const CommunityFeed: React.FC = () => {
  const { idToken } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ content: '', subject: '', tags: '' });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const loadFeed = useCallback(async () => {
    if (!idToken) return;
    setLoading(true);
    setError(null);
    try {
      const { posts: feed } = await getCommunityFeed(idToken, {
        query: searchTerm || undefined,
        limit: 50,
      });
      setPosts(feed);
    } catch (err) {
      console.error(err);
      setError('Unable to load the community feed right now. Please try again soon.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, idToken]);

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
      setDraft({ content: '', subject: '', tags: '' });
      setShowComposeModal(false);
    } catch (err) {
      console.error(err);
      setError('Unable to publish your post right now. Please retry in a moment.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReply = async (postId: string) => {
    if (!idToken || !replyContent.trim()) return;

    try {
      const reply = await createCommunityPost(idToken, {
        content: replyContent.trim(),
        parentId: postId
      });
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
      setReplyContent('');
      setReplyingTo(null);
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
      setError('Unable to update the like count. Please retry.');
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

  const renderPost = (post: CommunityPost, isReply = false) => {
    const isTeacher = post.authorRole === 'teacher' || post.isTeacher;

    return (
      <article
        key={post.id}
        className={`border-b border-[var(--border-subtle)] p-4 hover:bg-[var(--bg-secondary)]/20 transition-colors ${
          isReply ? 'border-l-2 border-l-[var(--accent-primary)]/30 ml-8' : ''
        }`}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              isTeacher
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--text-primary)] text-white'
            }`}>
              {post.authorName.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-[var(--text-primary)] text-sm">
                {post.authorName}
              </span>
              {isTeacher && (
                <span className="inline-flex items-center gap-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded-full text-xs font-medium">
                  Teacher
                </span>
              )}
              <span className="text-[var(--text-muted)] text-sm">·</span>
              <span className="text-[var(--text-muted)] text-sm">
                {formatRelativeTime(post.createdAt)}
              </span>
              {!isReply && post.subject && (
                <>
                  <span className="text-[var(--text-muted)] text-sm">·</span>
                  <span className="text-[var(--accent-primary)] text-sm font-medium">
                    {post.subject}
                  </span>
                </>
              )}
            </div>

            {/* Post Content */}
            <p className="text-[var(--text-primary)] text-sm leading-5 mb-3 whitespace-pre-wrap">
              {post.content}
            </p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && !isReply && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[var(--accent-primary)] text-sm hover:underline cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            {!isReply && (
              <div className="flex items-center justify-between max-w-md mt-3">
                <button
                  onClick={() => setReplyingTo(post.id)}
                  className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors group"
                >
                  <div className="p-2 rounded-full group-hover:bg-[var(--accent-primary)]/10 transition-colors">
                    <MessageCircle size={16} />
                  </div>
                  <span className="text-sm">{post.replyCount}</span>
                </button>

                <button
                  onClick={() => handleUpvote(post.id)}
                  className={`flex items-center gap-2 transition-colors group ${
                    post.hasUpvoted
                      ? 'text-red-500'
                      : 'text-[var(--text-muted)] hover:text-red-500'
                  }`}
                >
                  <div className={`p-2 rounded-full group-hover:bg-red-500/10 transition-colors ${
                    post.hasUpvoted ? 'bg-red-500/10' : ''
                  }`}>
                    <Heart size={16} className={post.hasUpvoted ? 'fill-current' : ''} />
                  </div>
                  <span className="text-sm">{post.upvoteCount}</span>
                </button>

                <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors group">
                  <div className="p-2 rounded-full group-hover:bg-[var(--accent-primary)]/10 transition-colors">
                    <Repeat2 size={16} />
                  </div>
                  <span className="text-sm">0</span>
                </button>

                <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors group">
                  <div className="p-2 rounded-full group-hover:bg-[var(--accent-primary)]/10 transition-colors">
                    <MoreHorizontal size={16} />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reply Input */}
        {replyingTo === post.id && (
          <div className="mt-3 ml-13">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[var(--text-primary)] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                U
              </div>
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Post your reply..."
                  className="w-full bg-transparent border-0 resize-none text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none"
                  rows={3}
                  maxLength={280}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-[var(--text-muted)]">
                    {replyContent.length}/280
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                      className="px-4 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReply(post.id)}
                      disabled={!replyContent.trim()}
                      className="px-4 py-1.5 bg-[var(--accent-primary)] text-white text-sm font-semibold rounded-full hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {!isReply && post.replies && post.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {post.replies.slice(0, 3).map((reply) => renderPost(reply, true))}
            {post.replies.length > 3 && (
              <button className="text-[var(--accent-primary)] text-sm hover:underline ml-13">
                Show {post.replyCount - 3} more replies
              </button>
            )}
          </div>
        )}
      </article>
    );
  };

  if (!idToken) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">Sign in to join the community</p>
          <p className="text-[var(--text-secondary)]">Connect with peers and mentors to share knowledge and support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with Post Button */}
      <div className="sticky top-0 bg-[var(--bg-app)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Community</h1>
          <button
            onClick={() => setShowComposeModal(true)}
            className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Post
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Posts Feed */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[var(--accent-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-[var(--accent-primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {searchTerm ? 'No posts found' : 'No posts yet'}
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">
              {searchTerm ? 'Try a different search term' : 'Be the first to start a conversation!'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowComposeModal(true)}
                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white px-6 py-2 rounded-full font-semibold text-sm transition-colors"
              >
                Create first post
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => renderPost(post))
        )}
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Create Post</h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <textarea
                value={draft.content}
                onChange={(e) => setDraft(prev => ({ ...prev, content: e.target.value }))}
                placeholder="What's on your mind?"
                className="w-full bg-transparent border-0 resize-none text-[var(--text-primary)] text-lg placeholder-[var(--text-muted)] focus:outline-none min-h-[120px]"
                rows={4}
                maxLength={MAX_POST_LENGTH}
              />

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <input
                  type="text"
                  value={draft.subject}
                  onChange={(e) => setDraft(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Subject (optional)"
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                />
                <input
                  type="text"
                  value={draft.tags}
                  onChange={(e) => setDraft(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Tags (optional)"
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-[var(--text-muted)]">
                  {draft.content.length}/{MAX_POST_LENGTH}
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowComposeModal(false);
                      setDraft({ content: '', subject: '', tags: '' });
                    }}
                    className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing || !draft.content.trim()}
                    className="px-6 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPublishing ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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

export default CommunityFeed;
