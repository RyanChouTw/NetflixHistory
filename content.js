class NetflixTracker {
    constructor() {
        this.observer = null;
        this.checkInfoInterval = null;
        this.currentUrl = location.href;
        this.isActive = true;
    }

    async init() {
        try {
            await this.checkExtensionStatus();
            this.setupObserver();
            this.checkInitialPage();
        } catch (error) {
            console.error('初始化失敗:', error);
            this.cleanup();
        }
    }

    async checkExtensionStatus() {
        try {
            await chrome.runtime.sendMessage({ type: 'PING' });
            return true;
        } catch (error) {
            this.isActive = false;
            throw new Error('擴充功能已失效');
        }
    }

    async getVideoInfo() {
        if (!this.isActive) return null;

        try {
            // 取得標題
            const titleElement = document.querySelector('[data-uia="video-title"]') || 
                               document.querySelector('.video-title h4');
            const title = titleElement?.textContent?.trim();

            // 取得影片ID和URL
            const url = location.href;
            const videoId = url.includes('/watch/') ? 
                url.split('/watch/')[1].split('?')[0] : null;

            // 使用通用的播放圖示
            const thumbnail = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlNTA5MTQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCI+PC9jaXJjbGU+PHBvbHlnb24gcG9pbnRzPSIxMCA4IDE2IDEyIDEwIDE2IDEwIDgiPjwvcG9seWdvbj48L3N2Zz4=';

            console.log('Video info found:', { title, videoId, thumbnail }); // 除錯用
            return { title, videoId, thumbnail, url };
        } catch (error) {
            console.error('取得影片資訊失敗:', error);
            return null;
        }
    }

    async saveVideoInfo(videoInfo) {
        if (!this.isActive || !videoInfo) return;

        try {
            await chrome.runtime.sendMessage({
                type: 'SAVE_NETFLIX_HISTORY',
                data: {
                    id: videoInfo.videoId,
                    title: videoInfo.title,
                    thumbnail: videoInfo.thumbnail,
                    url: videoInfo.url,
                    timestamp: Date.now()
                }
            });
            console.log('影片資訊已儲存');
        } catch (error) {
            console.error('儲存影片資訊失敗:', error);
            this.isActive = false;
            this.cleanup();
        }
    }

    captureNetflixInfo() {
        if (!this.isActive) return;

        console.log('開始擷取 Netflix 資訊...');
        let attempts = 0;
        const maxAttempts = 15; // 增加嘗試次數

        this.checkInfoInterval = setInterval(async () => {
            if (!this.isActive || attempts >= maxAttempts) {
                clearInterval(this.checkInfoInterval);
                return;
            }

            try {
                const videoInfo = await this.getVideoInfo();
                console.log('Found info:', videoInfo); // 除錯用

                if (videoInfo?.title && videoInfo?.videoId) {
                    await this.saveVideoInfo(videoInfo);
                    
                    // 如果有縮圖就立即停止，否則繼續嘗試
                    if (videoInfo.thumbnail) {
                        clearInterval(this.checkInfoInterval);
                    }
                }
            } catch (error) {
                console.error('擷取資訊時發生錯誤:', error);
                clearInterval(this.checkInfoInterval);
            }

            attempts++;
        }, 1000);

        // 延長總等待時間到 15 秒
        setTimeout(() => {
            if (this.checkInfoInterval) {
                clearInterval(this.checkInfoInterval);
            }
        }, 15000);
    }

    setupObserver() {
        if (!this.isActive) return;

        this.observer = new MutationObserver(() => {
            if (!this.isActive) {
                this.cleanup();
                return;
            }

            if (this.currentUrl !== location.href) {
                this.currentUrl = location.href;
                if (this.currentUrl.includes('netflix.com/watch/')) {
                    console.log('URL 已變更至觀看頁面');
                    this.captureNetflixInfo();
                }
            }
        });

        this.observer.observe(document.body, { 
            subtree: true, 
            childList: true 
        });
    }

    checkInitialPage() {
        if (location.href.includes('netflix.com/watch/')) {
            console.log('初始頁面為觀看頁面');
            this.captureNetflixInfo();
        }
    }

    cleanup() {
        console.log('清理資源...');
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        if (this.checkInfoInterval) {
            clearInterval(this.checkInfoInterval);
            this.checkInfoInterval = null;
        }
        this.isActive = false;
    }
}

// 初始化追蹤器
const tracker = new NetflixTracker();
tracker.init().catch(console.error);

// 處理擴充功能被停用的情況
window.addEventListener('unload', () => {
    tracker.cleanup();
});