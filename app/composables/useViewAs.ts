/**
 * Admin "View as": opens the customer portal exactly as another account sees
 * it (read-only, until "Exit view" in the portal banner).
 */
export function useViewAs() {
  const viewingId = ref('')
  async function viewPortalAs(userId: string, page = '/portal/dashboard') {
    if (!userId) return
    viewingId.value = userId
    try {
      await $fetch('/api/admin/view-as', { method: 'POST', body: { user_id: userId } })
      // Full load so the portal fetches everything as the viewed account
      window.location.href = page
    } catch (e: any) {
      viewingId.value = ''
      alert(e?.data?.statusMessage || 'Unable to open the portal for that account.')
    }
  }
  return { viewPortalAs, viewingId }
}
