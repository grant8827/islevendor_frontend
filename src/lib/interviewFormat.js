/** "Thu, 16 Oct, 10:00 am" — how an interview time reads everywhere. */
export const formatInterview = (iso) =>
  new Date(iso).toLocaleString('en-JM', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
