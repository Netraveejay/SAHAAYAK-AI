const DB_NAME = 'SahaayakDB';
const DB_VERSION = 1;

class OfflineStorage {
  constructor() {
    this.db = null;
  }
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('schemes')) {
          db.createObjectStore('schemes', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('applications')) {
          db.createObjectStore('applications', { keyPath: 'id' });
        }
      };
    });
  }
  
  async saveProfiles(profiles) {
    if (!this.db) await this.init();
    
    const tx = this.db.transaction('profiles', 'readwrite');
    const store = tx.objectStore('profiles');
    
    for (const profile of profiles) {
      store.put(profile);
    }
    
    return tx.complete;
  }
  
  async getProfiles() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('profiles', 'readonly');
      const store = tx.objectStore('profiles');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async saveSchemes(schemes) {
    if (!this.db) await this.init();
    
    const tx = this.db.transaction('schemes', 'readwrite');
    const store = tx.objectStore('schemes');
    
    for (const scheme of schemes) {
      store.put(scheme);
    }
    
    return tx.complete;
  }
  
  async getSchemes() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('schemes', 'readonly');
      const store = tx.objectStore('schemes');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async saveApplications(applications) {
    if (!this.db) await this.init();
    
    const tx = this.db.transaction('applications', 'readwrite');
    const store = tx.objectStore('applications');
    
    for (const app of applications) {
      store.put(app);
    }
    
    return tx.complete;
  }
  
  async getApplications() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('applications', 'readonly');
      const store = tx.objectStore('applications');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
export default offlineStorage;
