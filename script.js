// Supabase設定（ここにあなたのSupabaseプロジェクトの設定を入れてください）
const supabaseUrl = 'https://xiuabezuqwtdgpyrifwae.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWFiZXp1cXd0Z3B5cmlmd2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNjM4OTMsImV4cCI6MjA5NDkzOTg5M30.mLWPWCHo12-bnwMls1QULGZm-LzLnl5QLeena8HL0Sc';

// Supabase初期化
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// ローカルストレージキー
const STORAGE_KEY = "messageBoard_access";

// 初期データ
const initialData = {
    accessCode: 'group2026',
    adminCode: 'admin2026',
    messages: [],
    groupRequests: [],
    approvedRequests: []
};

// データ読み込み
async function loadData() {
    try {
        const { data, error } = await supabase
            .from('app_data')
            .select('*')
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                // データが存在しない場合
                return initialData;
            }
            console.error('データ読み込みエラー:', error);
            return initialData;
        }
        
        return data || initialData;
    } catch (e) {
        console.error('データ読み込みエラー:', e);
        return initialData;
    }
}

// データ保存
async function saveData(data) {
    try {
        const { error } = await supabase
            .from('app_data')
            .upsert(data);
        
        if (error) {
            console.error('データ保存エラー:', error);
            return false;
        }
        
        return true;
    } catch (e) {
        console.error('データ保存エラー:', e);
        return false;
    }
}

// コードチェック
async function checkCode() {
    const inputCode = document.getElementById('accessCode').value;
    const errorMessage = document.getElementById('errorMessage');
    const data = await loadData();
    
    if (inputCode === data.accessCode) {
        localStorage.setItem(STORAGE_KEY, Date.now());
        window.location.href = 'messages.html';
    } else {
        errorMessage.textContent = 'コードが間違っています';
        document.getElementById('accessCode').value = '';
    }
}

// アクセス認証チェック
function checkAccess() {
    const accessTime = localStorage.getItem(STORAGE_KEY);
    if (!accessTime) {
        window.location.href = 'index.html';
        return false;
    }
    
    // 24時間後にアクセス期限切れ
    const hoursSinceAccess = (Date.now() - parseInt(accessTime)) / (1000 * 60 * 60);
    if (hoursSinceAccess > 24) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// ログアウト
function logout() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = 'index.html';
}

// メッセージ投稿
async function postMessage() {
    const userName = document.getElementById('userName').value.trim();
    const messageContent = document.getElementById('messageContent').value.trim();
    
    if (!userName || !messageContent) {
        alert('名前とメッセージを入力してください');
        return;
    }
    
    const data = await loadData();
    
    const newMessage = {
        id: Date.now(),
        name: userName,
        content: messageContent,
        timestamp: new Date().toLocaleString('ja-JP')
    };
    
    data.messages.unshift(newMessage);
    
    if (await saveData(data)) {
        document.getElementById('userName').value = '';
        document.getElementById('messageContent').value = '';
        displayMessages();
    } else {
        alert('保存に失敗しました');
    }
}

// メッセージ表示
async function displayMessages() {
    const messagesList = document.getElementById('messagesList');
    const data = await loadData();
    
    if (data.messages.length === 0) {
        messagesList.innerHTML = '<p class="no-messages">まだメッセージがありません</p>';
        return;
    }
    
    messagesList.innerHTML = data.messages.map(msg => `
        <div class="message-card">
            <div class="message-header">
                <span class="message-name">${escapeHtml(msg.name)}</span>
                <span class="message-time">${msg.timestamp}</span>
            </div>
            <div class="message-content">${escapeHtml(msg.content)}</div>
        </div>
    `).join('');
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 管理者コードチェック
async function checkAdminCode() {
    const adminCode = document.getElementById('adminCode').value;
    const errorMessage = document.getElementById('adminError');
    const data = await loadData();
    
    if (adminCode === data.adminCode) {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadCurrentCode();
        displayGroupRequests();
    } else {
        errorMessage.textContent = '管理者コードが間違っています';
        document.getElementById('adminCode').value = '';
    }
}

// 現在のコードを表示
async function loadCurrentCode() {
    const data = await loadData();
    document.getElementById('currentCode').textContent = data.accessCode;
}

// 新しいコードを設定
async function setNewCode() {
    const newCode = document.getElementById('newCode').value.trim();
    const adminCode = document.getElementById('adminCode').value;
    const errorMessage = document.getElementById('setCodeError');
    const successMessage = document.getElementById('setCodeSuccess');
    
    errorMessage.textContent = '';
    successMessage.textContent = '';
    
    if (!newCode) {
        errorMessage.textContent = 'コードを入力してください';
        return;
    }
    
    const data = await loadData();
    
    // 管理者認証
    if (adminCode !== data.adminCode) {
        errorMessage.textContent = '管理者コードが間違っています';
        return;
    }
    
    if (newCode.length < 4) {
        errorMessage.textContent = 'コードは4文字以上である必要があります';
        return;
    }
    
    // 既存のコードチェック
    if (newCode === data.accessCode) {
        errorMessage.textContent = 'このコードは既に存在しています';
        return;
    }
    
    data.accessCode = newCode;
    
    if (await saveData(data)) {
        successMessage.textContent = 'アクセスコードを更新しました';
        document.getElementById('newCode').value = '';
        loadCurrentCode();
    } else {
        errorMessage.textContent = '保存に失敗しました';
    }
}

// 管理者ログアウト
function logoutAdmin() {
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminCode').value = '';
}

// トップページに戻る
function goToIndex() {
    window.location.href = 'index.html';
}

// グループ追加申告送信
async function submitRequest() {
    const groupName = document.getElementById('groupName').value.trim();
    const groupDescription = document.getElementById('groupDescription').value.trim();
    const requesterName = document.getElementById('requesterName').value.trim();
    const requesterEmail = document.getElementById('requesterEmail').value.trim();
    const desiredCode = document.getElementById('desiredCode').value.trim();
    const messageElement = document.getElementById('requestMessage');
    
    if (!groupName || !groupDescription || !requesterName || !requesterEmail || !desiredCode) {
        messageElement.textContent = 'すべての項目を入力してください';
        messageElement.className = 'message error';
        return;
    }
    
    const data = await loadData();
    
    const newRequest = {
        id: Date.now(),
        groupName,
        groupDescription,
        requesterName,
        requesterEmail,
        desiredCode,
        timestamp: new Date().toLocaleString('ja-JP'),
        status: 'pending'
    };
    
    data.groupRequests.unshift(newRequest);
    
    if (await saveData(data)) {
        messageElement.textContent = '申告を送信しました';
        messageElement.className = 'message success';
        document.getElementById('groupName').value = '';
        document.getElementById('groupDescription').value = '';
        document.getElementById('requesterName').value = '';
        document.getElementById('requesterEmail').value = '';
        document.getElementById('desiredCode').value = '';
    } else {
        messageElement.textContent = '保存に失敗しました';
        messageElement.className = 'message error';
    }
}

// グループ申告一覧表示（管理者用）
async function displayGroupRequests() {
    const requestsList = document.getElementById('requestsList');
    const data = await loadData();
    
    if (data.groupRequests.length === 0) {
        requestsList.innerHTML = '<p class="no-requests">まだ申告がありません</p>';
        return;
    }
    
    requestsList.innerHTML = data.groupRequests.map(req => `
        <div class="request-card">
            <div class="request-header">
                <span class="request-group-name">${escapeHtml(req.groupName)}</span>
                <span class="request-status ${req.status}">${getStatusText(req.status)}</span>
            </div>
            <div class="request-details">
                <p><strong>説明:</strong> ${escapeHtml(req.groupDescription)}</p>
                <p><strong>申告者:</strong> ${escapeHtml(req.requesterName)}</p>
                <p><strong>Gmail:</strong> ${escapeHtml(req.requesterEmail)}</p>
                <p><strong>希望コード:</strong> ${escapeHtml(req.desiredCode)}</p>
                <p><strong>申告日時:</strong> ${req.timestamp}</p>
            </div>
            ${req.status === 'pending' ? `
            <div class="request-actions">
                <button onclick="approveRequest(${req.id})" class="approve-btn">承認</button>
                <button onclick="rejectRequest(${req.id})" class="reject-btn">拒否</button>
            </div>
            ` : ''}
        </div>
    `).join('');
    
    setupTouchEvents();
}

// ステータステキスト取得
function getStatusText(status) {
    switch(status) {
        case 'pending': return '保留中';
        case 'approved': return '承認済み';
        case 'rejected': return '拒否';
        default: return status;
    }
}

// 申告承認
async function approveRequest(requestId) {
    const adminCode = document.getElementById('adminCode').value;
    const data = await loadData();
    
    // 管理者認証
    if (adminCode !== data.adminCode) {
        alert('管理者コードが間違っています');
        return;
    }
    
    const requestIndex = data.groupRequests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
        alert('申告が見つかりません');
        return;
    }
    
    // 申告を承認済み配列に移動
    const approvedRequest = data.groupRequests.splice(requestIndex, 1)[0];
    approvedRequest.status = 'approved';
    approvedRequest.approvedAt = new Date().toLocaleString('ja-JP');
    data.approvedRequests.push(approvedRequest);
    
    if (await saveData(data)) {
        displayGroupRequests();
    } else {
        alert('保存に失敗しました');
    }
}

// 申告拒否
async function rejectRequest(requestId) {
    const adminCode = document.getElementById('adminCode').value;
    const data = await loadData();
    
    // 管理者認証
    if (adminCode !== data.adminCode) {
        alert('管理者コードが間違っています');
        return;
    }
    
    const requestIndex = data.groupRequests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
        alert('申告が見つかりません');
        return;
    }
    
    // 申告を削除
    data.groupRequests.splice(requestIndex, 1);
    
    if (await saveData(data)) {
        displayGroupRequests();
    } else {
        alert('保存に失敗しました');
    }
}

// 承認済み申告一覧表示（管理者用）
async function displayApprovedRequests() {
    const approvedList = document.getElementById('approvedList');
    const data = await loadData();
    
    if (data.approvedRequests.length === 0) {
        approvedList.innerHTML = '<p class="no-requests">まだ承認済み申告がありません</p>';
        return;
    }
    
    approvedList.innerHTML = data.approvedRequests.map(req => `
        <div class="request-card">
            <div class="request-header">
                <span class="request-group-name">${escapeHtml(req.groupName)}</span>
                <span class="request-status approved">承認済み</span>
            </div>
            <div class="request-details">
                <p><strong>説明:</strong> ${escapeHtml(req.groupDescription)}</p>
                <p><strong>申告者:</strong> ${escapeHtml(req.requesterName)}</p>
                <p><strong>Gmail:</strong> ${escapeHtml(req.requesterEmail)}</p>
                <p><strong>希望コード:</strong> ${escapeHtml(req.desiredCode)}</p>
                <p><strong>申告日時:</strong> ${req.timestamp}</p>
                <p><strong>承認日時:</strong> ${req.approvedAt}</p>
            </div>
        </div>
    `).join('');
}

// タブ切り替え
function showTab(tabName) {
    const pendingTab = document.getElementById('pendingTab');
    const approvedTab = document.getElementById('approvedTab');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    if (tabName === 'pending') {
        pendingTab.classList.add('active');
        approvedTab.classList.remove('active');
        tabBtns[0].classList.add('active');
        displayGroupRequests();
    } else if (tabName === 'approved') {
        pendingTab.classList.remove('active');
        approvedTab.classList.add('active');
        tabBtns[1].classList.add('active');
        displayApprovedRequests();
    }
}

// モバイルタッチ操作の改善
function setupTouchEvents() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        // タッチイベント
        button.addEventListener('touchstart', function(e) {
            this.style.opacity = '0.7';
            this.style.transform = 'scale(0.98)';
        }, { passive: true });
        
        button.addEventListener('touchend', function(e) {
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
        }, { passive: true });
        
        // マウスイベント（PC用）
        button.addEventListener('mousedown', function(e) {
            this.style.opacity = '0.7';
            this.style.transform = 'scale(0.98)';
        });
        
        button.addEventListener('mouseup', function(e) {
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
        });
        
        button.addEventListener('mouseleave', function(e) {
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
        });
        
        // ボタンのスタイル設定
        button.style.cursor = 'pointer';
        button.style.userSelect = 'none';
        button.style.webkitTapHighlightColor = 'transparent';
    });
}

// Enterキーでコード入力
document.addEventListener('DOMContentLoaded', function() {
    setupTouchEvents();
    
    const codeInput = document.getElementById('accessCode');
    if (codeInput) {
        codeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkCode();
            }
        });
    }
    
    const adminCodeInput = document.getElementById('adminCode');
    if (adminCodeInput) {
        adminCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkAdminCode();
            }
        });
    }
    
    // messages.htmlの場合
    if (window.location.pathname.includes('messages.html')) {
        if (checkAccess()) {
            displayMessages();
        }
    }
});
