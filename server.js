const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// データファイルパス
const DATA_FILE = path.join(__dirname, 'data.json');

// 初期データ
const initialData = {
    accessCode: 'group2026',
    adminCode: 'admin2026',
    messages: [],
    groupRequests: []
};

// データ読み込み
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            console.error('データ読み込みエラー:', e);
            return initialData;
        }
    }
    return initialData;
}

// データ保存
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('データ保存エラー:', e);
        return false;
    }
}

// 初期データ作成
if (!fs.existsSync(DATA_FILE)) {
    saveData(initialData);
}

// アクセスコード確認
app.get('/api/check-code/:code', (req, res) => {
    const data = loadData();
    const { code } = req.params;
    
    if (code === data.accessCode) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// 管理者コード確認
app.post('/api/check-admin', (req, res) => {
    const data = loadData();
    const { code } = req.body;
    
    if (code === data.adminCode) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// 現在のアクセスコード取得（管理者用）
app.get('/api/current-code', (req, res) => {
    const data = loadData();
    res.json({ code: data.accessCode });
});

// アクセスコード更新（管理者用）
app.post('/api/update-code', (req, res) => {
    const data = loadData();
    const { newCode, adminCode } = req.body;
    
    // 管理者認証
    if (adminCode !== data.adminCode) {
        return res.json({ success: false, error: '管理者コードが間違っています' });
    }
    
    if (!newCode || newCode.length < 4) {
        return res.json({ success: false, error: 'コードは4文字以上である必要があります' });
    }
    
    // 既存のコードチェック
    if (newCode === data.accessCode) {
        return res.json({ success: false, error: 'このコードは既に存在しています' });
    }
    
    data.accessCode = newCode;
    
    if (saveData(data)) {
        res.json({ success: true, message: 'アクセスコードを更新しました' });
    } else {
        res.json({ success: false, error: '保存に失敗しました' });
    }
});

// メッセージ取得
app.get('/api/messages', (req, res) => {
    const data = loadData();
    res.json({ messages: data.messages });
});

// メッセージ投稿
app.post('/api/messages', (req, res) => {
    const data = loadData();
    const { name, content } = req.body;
    
    if (!name || !content) {
        return res.json({ success: false, error: '名前とメッセージは必須です' });
    }
    
    const newMessage = {
        id: Date.now(),
        name,
        content,
        timestamp: new Date().toLocaleString('ja-JP')
    };
    
    data.messages.unshift(newMessage);
    
    if (saveData(data)) {
        res.json({ success: true, message: newMessage });
    } else {
        res.json({ success: false, error: '保存に失敗しました' });
    }
});

// グループ申告取得（管理者用）
app.get('/api/group-requests', (req, res) => {
    const data = loadData();
    res.json({ requests: data.groupRequests });
});

// グループ申告投稿
app.post('/api/group-requests', (req, res) => {
    const data = loadData();
    const { groupName, groupDescription, requesterName, requesterEmail, desiredCode } = req.body;
    
    if (!groupName || !groupDescription || !requesterName || !requesterEmail || !desiredCode) {
        return res.json({ success: false, error: 'すべての項目は必須です' });
    }
    
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
    
    if (saveData(data)) {
        res.json({ success: true, request: newRequest });
    } else {
        res.json({ success: false, error: '保存に失敗しました' });
    }
});

// グループ申告承認（管理者用）
app.post('/api/group-requests/:id/approve', (req, res) => {
    const data = loadData();
    const { id } = req.params;
    const { adminCode } = req.body;
    
    // 管理者認証
    if (adminCode !== data.adminCode) {
        return res.json({ success: false, error: '管理者コードが間違っています' });
    }
    
    const requestIndex = data.groupRequests.findIndex(req => req.id === parseInt(id));
    
    if (requestIndex === -1) {
        return res.json({ success: false, error: '申告が見つかりません' });
    }
    
    // 申告を削除
    data.groupRequests.splice(requestIndex, 1);
    
    if (saveData(data)) {
        res.json({ success: true, message: '申告を承認して削除しました' });
    } else {
        res.json({ success: false, error: '保存に失敗しました' });
    }
});

// グループ申告拒否（管理者用）
app.post('/api/group-requests/:id/reject', (req, res) => {
    const data = loadData();
    const { id } = req.params;
    const { adminCode } = req.body;
    
    // 管理者認証
    if (adminCode !== data.adminCode) {
        return res.json({ success: false, error: '管理者コードが間違っています' });
    }
    
    const requestIndex = data.groupRequests.findIndex(req => req.id === parseInt(id));
    
    if (requestIndex === -1) {
        return res.json({ success: false, error: '申告が見つかりません' });
    }
    
    // 申告を削除
    data.groupRequests.splice(requestIndex, 1);
    
    if (saveData(data)) {
        res.json({ success: true, message: '申告を拒否して削除しました' });
    } else {
        res.json({ success: false, error: '保存に失敗しました' });
    }
});

app.listen(PORT, () => {
    console.log(`サーバーが http://localhost:${PORT} で実行中`);
    console.log(`初期アクセスコード: ${initialData.accessCode}`);
    console.log(`初期管理者コード: ${initialData.adminCode}`);
});
