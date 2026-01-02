import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../../src/config';
import '../Discussion.css';

function DiscussionFilter({ onFilterChange }) {
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    sortBy: 'newest',
    timeRange: 'all',
    tags: [],
    searchQuery: ''
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    // Fetch available categories
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) return;

        const response = await axios.get(`${config.API_URL}/discussions/categories`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching discussion categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTagAdd = (e) => {
    e.preventDefault();
    if (tagInput && !filters.tags.includes(tagInput)) {
      const newTags = [...filters.tags, tagInput];
      setFilters({ ...filters, tags: newTags });
      onFilterChange({ ...filters, tags: newTags });
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    const newTags = filters.tags.filter(tag => tag !== tagToRemove);
    setFilters({ ...filters, tags: newTags });
    onFilterChange({ ...filters, tags: newTags });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    const resetFilters = {
      category: '',
      sortBy: 'newest',
      timeRange: 'all',
      tags: [],
      searchQuery: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
    setTagInput('');
  };

  return (
    <div className="discussion-filter">
      <h3>Filter Discussions</h3>

      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          className="search-input"
          placeholder="Search discussions..."
          value={filters.searchQuery}
          onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
        />
        <button type="submit" className="search-button" title="Search">
          <i className="fas fa-search"></i>
        </button>
      </form>

      <div className="filter-section">
        <label htmlFor="category">Category:</label>
        <select
          id="category"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category._id || category} value={category._id || category}>
              {category.name || category}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <label htmlFor="sortBy">Sort By:</label>
        <select
          id="sortBy"
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="mostLiked">Most Liked</option>
          <option value="mostReplies">Most Replies</option>
          <option value="mostViewed">Most Viewed</option>
        </select>
      </div>

      <div className="filter-section">
        <label htmlFor="timeRange">Time Range:</label>
        <select
          id="timeRange"
          value={filters.timeRange}
          onChange={(e) => handleFilterChange('timeRange', e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="day">Last 24 Hours</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      <div className="filter-section">
        <label htmlFor="tagInput">Tags:</label>
        <div className="tag-input-container">
          <form onSubmit={handleTagAdd}>
            <input
              id="tagInput"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag..."
            />
            <button type="submit" className="add-tag-btn">Add</button>
          </form>
        </div>

        {filters.tags.length > 0 && (
          <div className="filter-tags">
            {filters.tags.map((tag, index) => (
              <span key={index} className="filter-tag">
                {tag}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="remove-tag-btn"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleClearFilters}
        className="clear-filters-btn"
      >
        Clear All Filters
      </button>
    </div>
  );
}

export default DiscussionFilter;