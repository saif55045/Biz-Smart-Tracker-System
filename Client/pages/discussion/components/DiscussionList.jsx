import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

function DiscussionList({ discussions, pagination, onPageChange }) {
  const { currentPage, totalPages } = pagination;

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderPagination = () => {
    const pages = [];

    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        Previous
      </button>
    );

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn"
      >
        Next
      </button>
    );

    return pages;
  };

  return (
    <div className="discussion-list">
      {discussions.map(discussion => (
        <div key={discussion._id} className="discussion-card">
          <div className="discussion-card-header">
            <Link to={`/discussion/${discussion._id}`} className="discussion-title">
              {discussion.title}
            </Link>

            <span className={`discussion-category category-${(discussion.category || 'general').toLowerCase().replace(' ', '-')}`}>
              {discussion.category || 'General'}
            </span>
          </div>

          <div className="discussion-card-content">
            <p className="discussion-excerpt">
              {discussion.content.length > 150
                ? discussion.content.substring(0, 150) + '...'
                : discussion.content}
            </p>
          </div>

          {discussion.tags && discussion.tags.length > 0 && (
            <div className="discussion-tags">
              {discussion.tags.map((tag, index) => (
                <span key={index} className="discussion-tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="discussion-card-footer">
            <div className="discussion-meta">
              <span>By {discussion.author?.company_name || 'Unknown User'}</span>
              <span>•</span>
              <span>{formatDate(discussion.createdAt)}</span>
              <Link to={`/discussion/${discussion._id}`} className="read-more-link">
                Read More <i className="fas fa-chevron-right"></i>
              </Link>
            </div>

            <div className="discussion-stats">
              <Link to={`/discussion/${discussion._id}`} className="discussion-stat" title="Likes">
                <i className="fas fa-heart"></i>
                {discussion.likes?.length || 0}
              </Link>
              <Link to={`/discussion/${discussion._id}`} className="discussion-stat" title="Replies">
                <i className="fas fa-comment"></i>
                {discussion.replies?.length || 0}
              </Link>
              <Link to={`/discussion/${discussion._id}`} className="discussion-stat" title="Views">
                <i className="fas fa-eye"></i>
                {discussion.views || 0}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="discussion-pagination">
          {renderPagination()}
        </div>
      )}
    </div>
  );
}

export default DiscussionList;