import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateArticle.css';

const CreateArticle = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    tags: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState(''); // 'success', 'error', 'warning'

  // Handle input field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value.trim() // Remove leading/trailing whitespace
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Validate title
    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must not exceed 200 characters';
    }

    // Validate body
    if (!formData.body || formData.body.trim() === '') {
      newErrors.body = 'Body is required';
    } else if (formData.body.length < 10) {
      newErrors.body = 'Body must be at least 10 characters long';
    }

    // Validate tags (optional but if provided, should be valid)
    if (formData.tags && formData.tags.trim() !== '') {
      const tagArray = formData.tags.split(',').map(tag => tag.trim());
      if (tagArray.some(tag => tag.length === 0)) {
        newErrors.tags = 'Tags should not be empty. Use comma-separated values.';
      } else if (tagArray.length > 10) {
        newErrors.tags = 'Maximum 10 tags allowed';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handlePublish = async (e) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      setAlertMessage('Please check the form errors and try again.');
      setAlertType('error');
      return;
    }

    setLoading(true);
    setAlertMessage('');

    try {
      // Prepare the payload
      const payload = {
        title: formData.title.trim(),
        body: formData.body.trim(),
        tags: formData.tags
          ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
          : []
      };

      console.log('Publishing article with payload:', payload); // Debug log

      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setAlertMessage('Authentication token not found. Please log in again.');
        setAlertType('error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Make API request
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/articles`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 201 || response.status === 200) {
        setAlertMessage('Article published successfully!');
        setAlertType('success');
        
        // Reset form
        setFormData({
          title: '',
          body: '',
          tags: ''
        });
        setErrors({});

        // Redirect to article details or articles list after 1.5 seconds
        setTimeout(() => {
          navigate(`/articles/${response.data.id || response.data._id}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error publishing article:', error);
      
      if (error.response?.status === 401) {
        setAlertMessage('Unauthorized. Please log in again.');
        setAlertType('error');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 400) {
        setAlertMessage(error.response.data?.message || 'Invalid input. Please check your data.');
        setAlertType('error');
      } else if (error.response?.status === 413) {
        setAlertMessage('Content is too large. Please reduce the size of your article.');
        setAlertType('error');
      } else {
        setAlertMessage(
          error.response?.data?.message ||
          error.message ||
          'An error occurred while publishing the article. Please try again.'
        );
        setAlertType('error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    setFormData({
      title: '',
      body: '',
      tags: ''
    });
    setErrors({});
    setAlertMessage('');
  };

  return (
    <div className="create-article-container">
      <div className="create-article-card">
        <h1>Create Article</h1>

        {/* Alert Message */}
        {alertMessage && (
          <div className={`alert alert-${alertType}`}>
            <p>{alertMessage}</p>
          </div>
        )}

        <form onSubmit={handlePublish} className="article-form">
          {/* Title Input */}
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter article title"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              maxLength="200"
              required
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
            <span className="char-count">{formData.title.length}/200</span>
          </div>

          {/* Body Input */}
          <div className="form-group">
            <label htmlFor="body">Body *</label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleInputChange}
              placeholder="Enter article content (minimum 10 characters)"
              className={`form-textarea ${errors.body ? 'input-error' : ''}`}
              rows="10"
              required
            />
            {errors.body && <span className="error-message">{errors.body}</span>}
            <span className="char-count">{formData.body.length} characters</span>
          </div>

          {/* Tags Input */}
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="Enter tags separated by commas (e.g., javascript, react, web)"
              className={`form-input ${errors.tags ? 'input-error' : ''}`}
            />
            {errors.tags && <span className="error-message">{errors.tags}</span>}
            <span className="help-text">Enter comma-separated tags (max 10)</span>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Publish'}
            </button>
            <button
              type="reset"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateArticle;
