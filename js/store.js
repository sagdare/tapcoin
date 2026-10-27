class Store {
  constructor() {
    this.data = null;
    this.pendingBase = 0;
    this.pendingAt = Date.now();
    this.listeners = {};
  }

  set(data) {
    this.data = data;
    this.pendingBase = Number(data?.state?.pending_earnings) || 0;
    this.pendingAt = Date.now();
    this.emit('data:update', data);
  }

  on(event, cb) {
    (this.listeners[event] ||= []).push(cb);
  }

  emit(event, payload) {
    (this.listeners[event] || []).forEach(cb => {
      try { cb(payload); } catch (e) { console.error(e); }
    });
  }
}

export const store = new Store();