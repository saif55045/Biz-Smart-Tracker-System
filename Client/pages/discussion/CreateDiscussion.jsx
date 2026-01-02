import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../src/config';
import './Discussion.css';

export function CreateDiscussion() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Trend',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formValidation, setFormValidation] = useState({
    title: '',
    content: ''
  });
  const [previewMode, setPreviewMode] = useState(false);

  const [charCount, setCharCount] = useState({
    title: 0,
    content: 0
  });

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get(`${config.API_URL}/user/current-user`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCurrentUser(response.data);
      } catch (err) {
        console.error('Error fetching user:', err);
        navigate('/discussion');
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    setCharCount({
      title: formData.title.length,
      content: formData.content.length
    });
  }, [formData.title, formData.content]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (formValidation[name]) {
      setFormValidation(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();

    if (!tagInput.trim()) return;

    if (formData.tags.includes(tagInput.trim())) {
      setError('Tag already exists');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()]
    }));

    setTagInput('');
  };

  const handleRemoveTag = (index) => {
    const newTags = [...formData.tags];
    newTags.splice(index, 1);

    setFormData(prev => ({
      ...prev,
      tags: newTags
    }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long';
      isValid = false;
    }

    if (formData.content.trim().length < 20) {
      errors.content = 'Content must be at least 20 characters long';
      isValid = false;
    }

    setFormValidation(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post(`${config.API_URL}/discussions`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess(true);

      setTimeout(() => {
        navigate('/discussion');
      }, 1500);

    } catch (err) {
      console.error('Error creating discussion:', err);
      setError(err.response?.data?.message || 'Failed to create discussion. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  const renderFormattedContent = (content) => {
    if (!content) return '';

    const withLineBreaks = content.replace(/\n/g, '<br>');

    return { __html: withLineBreaks };
  };

  return (
    <div className="discussion-board-container">
      <div className="create-discussion-header">
        <h1>Create New Discussion</h1>
        <p>Share your thoughts, ideas, and questions with other shop owners</p>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i> Discussion created successfully! Redirecting...
        </div>
      )}

      <div className="form-card">
        <form className="discussion-form" onSubmit={handleSubmit}>
          <div className="toggle-view-mode">
            <button
              type="button"
              className={`toggle-btn ${!previewMode ? 'active' : ''}`}
              onClick={() => setPreviewMode(false)}
            >
              <i className="fas fa-edit"></i> Edit
            </button>
            <button
              type="button"
              className={`toggle-btn ${previewMode ? 'active' : ''}`}
              onClick={() => setPreviewMode(true)}
            >
              <i className="fas fa-eye"></i> Preview
            </button>
          </div>

          {!previewMode ? (
            <>
              <div className={`form-group ${formValidation.title ? 'has-error' : ''}`}>
                <label htmlFor="title">
                  Title <span className="required">*</span>
                  <span className="char-count">{charCount.title}/100</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className={formValidation.title ? 'error-input' : ''}
                  placeholder="Enter a clear, specific title for your discussion"
                />
                {formValidation.title && <div className="error-text">{formValidation.title}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category <span className="required">*</span></label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="Trend">Trend</option>
                  <option value="Challenge">Challenge</option>
                  <option value="Product Suggestion">Product Suggestion</option>
                  <option value="Question">Question</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={`form-group ${formValidation.content ? 'has-error' : ''}`}>
                <label htmlFor="content">
                  Content <span className="required">*</span>
                  <span className="char-count">{charCount.content}/5000</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  maxLength={5000}
                  className={formValidation.content ? 'error-input' : ''}
                  placeholder="Share your insights, challenges, or questions with other shopkeepers"
                  rows={10}
                />
                {formValidation.content && <div className="error-text">{formValidation.content}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags (optional)</label>
                <div className="form-tag-input">
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add relevant tags (press Enter after each tag)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(e);
                      }
                    }}
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="add-tag-button"
                  >
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>
                <p className="form-hint">Add up to 5 tags to help others find your discussion</p>

                {formData.tags.length > 0 && (
                  <div className="form-tags">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="form-tag">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(index)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="preview-container">
              <div className="preview-header">
                <h2>{formData.title || 'Discussion Title'}</h2>
                <span className={`discussion-category category-${formData.category.toLowerCase().replace(' ', '-')}`}>
                  {formData.category}
                </span>
              </div>

              <div className="preview-content">
                {formData.content ? (
                  <div dangerouslySetInnerHTML={renderFormattedContent(formData.content)} />
                ) : (
                  <p className="preview-placeholder">Your discussion content will appear here...</p>
                )}
              </div>

              {formData.tags.length > 0 && (
                <div className="preview-tags">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="discussion-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/discussion')}
            >
              <i className="fas fa-times"></i> Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span> Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Create Discussion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}