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
  on(evt, cb) { (this.listeners[evt] ||= []).push(cb); }
  emit(evt, p) { (this.listeners[evt] || []).forEach(cb => { try { cb(p); } catch(e){ console.error(e); } }); }
}
export const store = new Store();