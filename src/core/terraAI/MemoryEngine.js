/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA AI: MEMORY ENGINE
 *  Manages long-term storage, user preferences, and checkpoints.
 * ═══════════════════════════════════════════════════════════════
 */

export class MemoryEngine {
  constructor(storagePrefix = 'terra_memory') {
    this.prefix = storagePrefix;
    // In a real backend, this connects to IndexedDB or SQLite
    this.memoryStore = []; 
  }

  loadMemories(userId) {
    try {
      const data = localStorage.getItem(`${this.prefix}_${userId}`);
      if (data) {
        this.memoryStore = JSON.parse(data);
      } else {
        this.memoryStore = [
           { id: '1', text: 'User is a Chemical Engineering Student' }
        ];
      }
    } catch (e) {
      console.warn("Memory load failed, using mock data");
    }
    return this.memoryStore;
  }

  saveMemory(userId, text) {
    const newRecord = { id: Date.now().toString(), text, timestamp: new Date().toISOString() };
    this.memoryStore.push(newRecord);
    try {
      localStorage.setItem(`${this.prefix}_${userId}`, JSON.stringify(this.memoryStore));
    } catch(e) {}
    return newRecord;
  }
  
  deleteMemory(userId, id) {
      this.memoryStore = this.memoryStore.filter(m => m.id !== id);
      try {
        localStorage.setItem(`${this.prefix}_${userId}`, JSON.stringify(this.memoryStore));
      } catch(e) {}
  }

  getRelevantContext(query) {
    // Mock semantic search: just return all for now or filter by keyword
    // A true implementation uses Vector Embeddings
    return this.memoryStore.map(m => m.text).join('\n');
  }
}
