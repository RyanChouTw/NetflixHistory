document.addEventListener('DOMContentLoaded', async () => {
	const result = await chrome.storage.local.get(['netflixHistory', 'lastPlayedId']);
	const history = result.netflixHistory || [];
	const lastPlayedId = result.lastPlayedId;
	const container = document.getElementById('history-container');
	
	// 工具函數
	const showLoading = () => document.querySelector('.loading-overlay').classList.add('active');
	const hideLoading = () => document.querySelector('.loading-overlay').classList.remove('active');
	
	const showToast = (message, duration = 3000) => {
		const toast = document.querySelector('.toast');
		toast.textContent = message;
		toast.classList.add('active');
		setTimeout(() => toast.classList.remove('active'), duration);
	};

	if (history.length === 0) {
		container.innerHTML = '<div class="empty-message">尚無觀看紀錄</div>';
		return;
	}

	// 處理影片播放的函數
	async function playVideo(url, videoId) {
		try {
			showLoading();

			// 查找所有 Netflix 分頁
			const tabs = await chrome.tabs.query({
				url: "*://*.netflix.com/*"
			});

			if (tabs.length > 0) {
				// 找到正在播放的分頁（如果有的話）
				const playingTab = tabs.find(tab => 
					tab.url.includes('netflix.com/watch/')
				);

				if (playingTab) {
					await chrome.tabs.update(playingTab.id, { 
						url: url,
						active: true 
					});
				} else {
					await chrome.tabs.update(tabs[0].id, { 
						url: url,
						active: true 
					});
				}

				const tab = tabs[0];
				await chrome.windows.update(tab.windowId, { focused: true });
			} else {
				await chrome.tabs.create({ url: url });
			}

			// 儲存最後播放的影片 ID
			await chrome.storage.local.set({ lastPlayedId: videoId });

			// 更新 UI 中的最後播放標記
			document.querySelectorAll('.history-item').forEach(item => {
				item.classList.remove('last-played');
				if (item.dataset.videoId === videoId) {
					item.classList.add('last-played');
				}
			});

			hideLoading();
			window.close();
		} catch (error) {
			hideLoading();
			console.error('播放影片時發生錯誤:', error);
			showToast('播放影片時發生錯誤，請稍後再試');
		}
	}

	function formatDateTime(timestamp) {
		const date = new Date(timestamp);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		
		return `${year}/${month}/${day} ${hours}:${minutes}`;
	}

	history.forEach(item => {
		const div = document.createElement('div');
		div.className = 'history-item';
		if (item.id === lastPlayedId) {
			div.classList.add('last-played');
		}
		div.dataset.videoId = item.id;

		div.innerHTML = `
			<div class="thumbnail-container" role="button" title="播放影片">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#e50914">
					<path d="M8 5v14l11-7z"/>
				</svg>
			</div>
			<div class="info">
				<h3>${item.title}</h3>
				<div class="item-footer">
					<a href="${item.url}">觀看影片</a>
					<span class="timestamp">${formatDateTime(item.timestamp)}</span>
				</div>
			</div>
		`;

		const playButton = div.querySelector('.thumbnail-container');
		playButton.addEventListener('click', () => {
			playVideo(item.url, item.id);
		});

		const watchLink = div.querySelector('.info a');
		watchLink.addEventListener('click', (e) => {
			e.preventDefault();
			playVideo(item.url, item.id);
		});

		container.appendChild(div);
	});

	// 錯誤處理
	window.addEventListener('error', (event) => {
		hideLoading();
		showToast('發生錯誤，請重新整理後再試');
		console.error('Popup error:', event.error);
	});
});