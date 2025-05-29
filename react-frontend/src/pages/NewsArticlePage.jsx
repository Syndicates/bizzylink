import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import NewsService from '../services/NewsService';
import { useAuth } from '../contexts/AuthContext';

const NewsArticlePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [previous, setPrevious] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentError, setCommentError] = useState(null);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      NewsService.getNewsById(id),
      NewsService.getNews({ limit: 5 })
    ])
      .then(([news, prevList]) => {
        setArticle(news);
        setPrevious((prevList.news || []).filter(n => n._id !== id).slice(0, 4));
        setError(null);
      })
      .catch(() => setError('Failed to load news article'))
      .finally(() => setLoading(false));
    NewsService.getComments(id)
      .then(setComments)
      .catch(() => {});
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setCommentLoading(true);
    setCommentError(null);
    try {
      const newComment = await NewsService.addComment(id, commentBody);
      setComments([...comments, newComment]);
      setCommentBody('');
    } catch (err) {
      setCommentError('Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-lg text-gray-400">Loading news...</div>;
  if (error || !article) return <div className="py-16 text-center text-red-500">{error || 'News not found.'}</div>;

  return (
    <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto p-4 md:p-8">
      {/* Main Article */}
      <main className="flex-1 min-w-0">
        <div className="bg-gray-900 rounded-xl shadow-xl p-6 md:p-10 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {article.bannerType === 'head' && article.bannerHeadUsername && (
              <img src={`https://mc-heads.net/avatar/${article.bannerHeadUsername}/64`} alt={article.bannerHeadUsername} className="w-14 h-14 rounded shadow" />
            )}
            {article.bannerType === 'custom' && article.bannerImage && (
              <img src={article.bannerImage} alt="News banner" className="w-20 h-20 rounded shadow object-cover" />
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{article.title}</h1>
              <div className="text-sm text-gray-300 italic">
                {new Date(article.createdAt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                <span className="ml-2">by {article.author?.username || 'Bizzy'}</span>
              </div>
            </div>
          </div>
          <div className="text-lg text-white mb-4 whitespace-pre-line">{article.body}</div>
        </div>
        {/* Comments */}
        <section className="bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-cyan-300 mb-4">Comments</h2>
          {comments.length === 0 && <div className="text-gray-400 mb-4">No comments yet.</div>}
          <ul className="space-y-4 mb-6">
            {comments.map((c) => (
              <li key={c._id} className="flex items-start gap-3">
                <img
                  src={`https://mc-heads.net/avatar/${c.author?.mcUsername || c.author?.username || 'Steve'}/32`}
                  alt={c.author?.username}
                  className="w-8 h-8 rounded shadow"
                />
                <div>
                  <div className="font-bold text-white">{c.author?.username || 'User'}</div>
                  <div className="text-xs text-gray-400 mb-1">{new Date(c.createdAt).toLocaleString()}</div>
                  <div className="text-gray-200 whitespace-pre-line">{c.body}</div>
                </div>
              </li>
            ))}
          </ul>
          {user ? (
            <form onSubmit={handleAddComment} className="flex flex-col gap-2">
              <textarea
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                rows={3}
                className="rounded bg-gray-900 border border-gray-700 text-white p-2"
                placeholder="Write a comment..."
                disabled={commentLoading}
              />
              <button
                type="submit"
                className="self-end px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                disabled={commentLoading || !commentBody.trim()}
              >
                {commentLoading ? 'Posting...' : 'Post Comment'}
              </button>
              {commentError && <div className="text-red-500 text-sm mt-1">{commentError}</div>}
            </form>
          ) : (
            <div className="text-gray-400">You must <Link to="/login" className="text-cyan-400 underline">login</Link> or <Link to="/register" className="text-cyan-400 underline">register</Link> to comment.</div>
          )}
        </section>
      </main>
      {/* Sidebar */}
      <aside className="w-full md:w-72 flex-shrink-0">
        <div className="bg-gray-900 rounded-xl shadow p-4">
          <h3 className="text-lg font-bold text-cyan-300 mb-4">Previous News</h3>
          <ul className="space-y-3">
            {previous.map((n) => (
              <li key={n._id}>
                <Link to={`/news/${n._id}`} className="flex items-center gap-3 hover:bg-gray-800 rounded p-2 transition">
                  {n.bannerType === 'head' && n.bannerHeadUsername && (
                    <img src={`https://mc-heads.net/avatar/${n.bannerHeadUsername}/32`} alt={n.bannerHeadUsername} className="w-8 h-8 rounded shadow" />
                  )}
                  {n.bannerType === 'custom' && n.bannerImage && (
                    <img src={n.bannerImage} alt="News banner" className="w-10 h-10 rounded shadow object-cover" />
                  )}
                  <div>
                    <div className="font-bold text-white line-clamp-1">{n.title}</div>
                    <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default NewsArticlePage; 