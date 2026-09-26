const STORAGE_KEY = "donation-reminders";

// TODO(backend): POST /api/reminders — server sends the SMS on the due date
export async function scheduleDonationReminder({ requestId, mobile, nextDate }) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const withoutDuplicate = list.filter((r) => r.requestId !== requestId);
    withoutDuplicate.push({
      requestId,
      mobile,
      nextDate,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutDuplicate));
  } catch {
    /* ignore storage errors */
  }
  return { ok: true };
}

// TODO(backend): DELETE /api/reminders/:requestId
export async function cancelDonationReminder(requestId) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list.filter((r) => r.requestId !== requestId))
    );
  } catch {
    /* ignore storage errors */
  }
  return { ok: true };
}
