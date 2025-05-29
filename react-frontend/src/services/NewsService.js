import api from './api';

const NewsService = {
  getNews: (params) => api.get('/api/news', { params }).then(res => res.data),
  getNewsById: (id) => api.get(`/api/news/${id}`).then(res => res.data),
  createNews: (data) => api.post('/api/news', data).then(res => res.data),
  updateNews: (id, data) => api.put(`/api/news/${id}`, data).then(res => res.data),
  deleteNews: (id) => api.delete(`/api/news/${id}`).then(res => res.data),
  getComments: (id) => api.get(`/api/news/${id}/comments`).then(res => res.data),
  addComment: (id, body) => api.post(`/api/news/${id}/comments`, { body }).then(res => res.data),
};

export default NewsService; 