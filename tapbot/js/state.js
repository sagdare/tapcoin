export const S = {user: null, last: Date.now(), pending: 0};
export function setUser(u) {
  S.user = {...S.user, ...u}; S.last = Date.now();
  document.dispatchEvent(new Event("user"));
}
