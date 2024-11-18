chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.type === 'SAVE_NETFLIX_HISTORY') {
    saveToHistory(message.data, sendResponse);
    return true;
  }
});

async function saveToHistory(data, sendResponse) {
  try {
    // 獲取現有歷史記錄
    const result = await chrome.storage.local.get('netflixHistory');
    let history = result.netflixHistory || [];

    // 檢查是否已存在相同 ID 的記錄
    const existingIndex = history.findIndex(item => item.id === data.id);

    if (existingIndex !== -1) {
      // 如果記錄已存在
      const existingItem = history[existingIndex];
      
      // 更新時間戳記
      existingItem.timestamp = Date.now();
      
      // 從原位置移除
      history.splice(existingIndex, 1);
      
      // 插入到最上方
      history.unshift(existingItem);
    } else {
      // 如果是新記錄，直接添加到最上方
      history.unshift({
        id: data.id,
        title: data.title,
        thumbnail: data.thumbnail,
        url: data.url,
        timestamp: Date.now()
      });
    }

    // 限制歷史記錄數量（可選）
    const MAX_HISTORY = 100;
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }

    // 儲存更新後的歷史記錄
    await chrome.storage.local.set({ 
      netflixHistory: history,
      lastPlayedId: data.id 
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('儲存歷史記錄時發生錯誤:', error);
    sendResponse({ success: false, error: error.message });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});