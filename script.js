// APIベースURL
const API_BASE = 'http://localhost:8000/api';

// ローカルストレージキー
const STORAGE_KEY = "messageBoard_access";

// コードチェック
async function checkCode() {
    const inputCode = document.getElementById('accessCode').value;
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        const response = await fetch(`${API_BASE}/check-code/${inputCode}`);
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem(STORAGE_KEY, Date.now());
            window.location.href = 'messages.html';
        } else {
            errorMessage.textContent = 'コードが間違っています';
            document.getElementById('accessCode').value = '';
        }
    } catch (error) {
        errorMessage.textContent = 'サーバーに接続できません';
        console.error('Error:', error);
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
    
    try {
        const response = await fetch(`${API_BASE}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: userName, content: messageContent })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('userName').value = '';
            document.getElementById('messageContent').value = '';
            displayMessages();
        } else {
            alert(data.error || '投稿に失敗しました');
        }
    } catch (error) {
        alert('サーバーに接続できません');
        console.error('Error:', error);
    }
}

// メッセージ表示
async function displayMessages() {
    const messagesList = document.getElementById('messagesList');
    
    try {
        const response = await fetch(`${API_BASE}/messages`);
        const data = await response.json();
        
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
    } catch (error) {
        messagesList.innerHTML = '<p class="no-messages">サーバーに接続できません</p>';
        console.error('Error:', error);
    }
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
    
    try {
        const response = await fetch(`${API_BASE}/check-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: adminCode })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            loadCurrentCode();
            displayGroupRequests();
        } else {
            errorMessage.textContent = '管理者コードが間違っています';
            document.getElementById('adminCode').value = '';
        }
    } catch (error) {
        errorMessage.textContent = 'サーバーに接続できません';
        console.error('Error:', error);
    }
}

// 現在のコードを表示
async function loadCurrentCode() {
    try {
        const response = await fetch(`${API_BASE}/current-code`);
        const data = await response.json();
        document.getElementById('currentCode').textContent = data.code;
    } catch (error) {
        console.error('Error:', error);
    }
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
    
    try {
        const response = await fetch(`${API_BASE}/update-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newCode, adminCode })
        });
        
        const data = await response.json();
        
        if (data.success) {
            successMessage.textContent = data.message;
            document.getElementById('newCode').value = '';
            loadCurrentCode();
        } else {
            errorMessage.textContent = data.error;
        }
    } catch (error) {
        errorMessage.textContent = 'サーバーに接続できません';
        console.error('Error:', error);
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
    
    try {
        const response = await fetch(`${API_BASE}/group-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ groupName, groupDescription, requesterName, requesterEmail, desiredCode })
        });
        
        const data = await response.json();
        
        if (data.success) {
            messageElement.textContent = '申告を送信しました';
            messageElement.className = 'message success';
            document.getElementById('groupName').value = '';
            document.getElementById('groupDescription').value = '';
            document.getElementById('requesterName').value = '';
            document.getElementById('requesterEmail').value = '';
            document.getElementById('desiredCode').value = '';
        } else {
            messageElement.textContent = data.error || '送信に失敗しました';
            messageElement.className = 'message error';
        }
    } catch (error) {
        messageElement.textContent = 'サーバーに接続できません';
        messageElement.className = 'message error';
        console.error('Error:', error);
    }
}

// グループ申告一覧表示（管理者用）
async function displayGroupRequests() {
    const requestsList = document.getElementById('requestsList');
    
    try {
        const response = await fetch(`${API_BASE}/group-requests`);
        const data = await response.json();
        
        if (data.requests.length === 0) {
            requestsList.innerHTML = '<p class="no-requests">まだ申告がありません</p>';
            return;
        }
        
        requestsList.innerHTML = data.requests.map(req => `
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
    } catch (error) {
        requestsList.innerHTML = '<p class="no-requests">サーバーに接続できません</p>';
        console.error('Error:', error);
    }
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
    
    try {
        const response = await fetch(`${API_BASE}/group-requests/${requestId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminCode })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayGroupRequests();
        } else {
            alert(data.error || '更新に失敗しました');
        }
    } catch (error) {
        alert('サーバーに接続できません');
        console.error('Error:', error);
    }
}

// 申告拒否
async function rejectRequest(requestId) {
    const adminCode = document.getElementById('adminCode').value;
    
    try {
        const response = await fetch(`${API_BASE}/group-requests/${requestId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminCode })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayGroupRequests();
        } else {
            alert(data.error || '更新に失敗しました');
        }
    } catch (error) {
        alert('サーバーに接続できません');
        console.error('Error:', error);
    }
}

// Enterキーでコード入力
document.addEventListener('DOMContentLoaded', function() {
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
