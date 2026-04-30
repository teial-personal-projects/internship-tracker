import type { JobBoard } from '@shared/types';
import { useJobBoards } from '@/hooks/useJobBoards';
import { AppHeader } from '@/components/AppHeader';
import { UserMenu } from '@/components/UserMenu';
import { Spinner } from '@/components/Spinner';

function BoardCard({ board }: { board: JobBoard }) {
  return (
    <a
      href={board.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col gap-1 hover:border-brand-400 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900 group-hover:text-brand-800 transition-colors">
          {board.label}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-brand-600 transition-colors shrink-0">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </div>
      <p className="text-sm text-gray-500">{board.description}</p>
    </a>
  );
}

export function JobBoardsPage() {
  const { data: boards = [], isLoading, error } = useJobBoards();

  const categories = [...new Set(boards.map((b) => b.category))];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <AppHeader>
        <UserMenu />
      </AppHeader>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 flex flex-col gap-8 overflow-hidden">
        <div>
          <p className="text-kicker mb-2" style={{ color: 'var(--accent)' }}>02 / RESOURCES</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Job Boards</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-3)' }}>Browse popular job boards to find your next internship.</p>
        </div>
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span>⚠️</span> Failed to load job boards. Please refresh.
          </div>
        )}

        {!isLoading && categories.map((category) => (
          <section key={category}>
            <h2 className="text-sm font-semibold text-brand-700 uppercase tracking-wider mb-3">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {boards
                .filter((b) => b.category === category)
                .map((board) => <BoardCard key={board.id} board={board} />)
              }
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
