import React from 'react';
import { ArrowBigUp, MessageCircle } from 'lucide-react';

interface CommunityActivityItem {
  id: string;
  authorName: string;
  subject?: string;
  content: string;
  createdAt: string;
  upvoteCount: number;
  replyCount: number;
}

interface CommunityActivityCardProps {
  posts: CommunityActivityItem[];
}

const CommunityActivityCard: React.FC<CommunityActivityCardProps> = ({ posts }) => {
  if (!posts.length) {
    return (
      <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] p-5 text-sm text-[var(--text-secondary)]">
        Community posts will appear here once your classmates start sharing.
      </div>
    );
  }

  const items = posts.slice(0, 3);

  return (
    <div className="glass-panel rounded-3xl border border-[var(--border-subtle)] p-5 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Community Activity</p>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Live questions</h3>
      </div>
      <div className="space-y-3">
        {items.map((post) => (
          <article key={post.id} className="rounded-2xl border border-white/5 bg-white/5/30 p-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">{post.authorName}</span>
              <span>{formatRelativeTime(post.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-primary)] line-clamp-2">{post.content}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              {post.subject && (
                <span className="rounded-full bg-white/5 px-2 py-0.5">{post.subject}</span>
              )}
              <span className="inline-flex items-center gap-1">
                <ArrowBigUp className="h-3 w-3" /> {post.upvoteCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> {post.replyCount}
              </span>
            </div>
          </article>
        ))}
      </div>
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

export default CommunityActivityCard;

