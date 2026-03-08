import { API } from './apiService';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const OFFLINE_QUEUE_KEY = 'offlineQueue';

export const authService = {
  async login(mobile, otp) {
    const response = await API.verifyOTP(mobile, otp);
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    
    return data;
  },
  
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  
  isAuthenticated() {
    return !!this.getToken();
  },
  
  // Offline queue management
  addToOfflineQueue(action) {
    const queue = this.getOfflineQueue();
    queue.push({ ...action, timestamp: Date.now() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },
  
  getOfflineQueue() {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  },
  
  clearOfflineQueue() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },
  
  async syncOfflineData() {
    if (!navigator.onLine) return;
    
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;
    
    const results = [];
    for (const action of queue) {
      try {
        let response;
        switch (action.type) {
          case 'CREATE_PROFILE':
            response = await API.createProfile(action.data);
            break;
          case 'UPDATE_PROFILE':
            response = await API.updateProfile(action.id, action.data);
            break;
          case 'CREATE_APPLICATION':
            response = await API.createApplication(action.data);
            break;
          default:
            continue;
        }
        
        if (response.ok) {
          results.push({ success: true, action });
        }
      } catch (error) {
        console.error('Sync error:', error);
        results.push({ success: false, action, error });
      }
    }
    
    this.clearOfflineQueue();
    return results;
  }
};

// Auto-sync when online
window.addEventListener('online', () => {
  authService.syncOfflineData();
});

export default authService;
