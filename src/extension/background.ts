chrome.action.onClicked.addListener((tab) => {
  if (tab.id !== undefined) {
    void chrome.sidePanel.open({ tabId: tab.id })
    // Store the meeting tab so the panel can request its audio stream
    void chrome.storage.session.set({ meetingTabId: tab.id })
  }
})

interface GetTabStreamIdResponse {
  streamId?: string
  error?: string
}

chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: GetTabStreamIdResponse) => void,
  ) => {
    if (!message || typeof message !== 'object') return

    const msg = message as Record<string, unknown>

    if (msg.type === 'GET_TAB_STREAM_ID') {
      chrome.storage.session.get('meetingTabId', (items) => {
        const tabId = items.meetingTabId as number | undefined
        if (!tabId) {
          sendResponse({
            error:
              'Close the panel, go to your meeting tab, then click the Memora icon again.',
          })
          return
        }
        chrome.tabCapture.getMediaStreamId(
          { targetTabId: tabId },
          (streamId) => {
            if (chrome.runtime.lastError) {
              sendResponse({
                error:
                  chrome.runtime.lastError.message ?? 'Tab capture failed.',
              })
            } else {
              sendResponse({ streamId })
            }
          },
        )
      })
      return true // keep message channel open for async response
    }
  },
)
