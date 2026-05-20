const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data.json');

const initialData = {
    accessCode: 'group2026',
    adminCode: 'admin2026',
    messages: [],
    groupRequests: [],
    approvedRequests: []
};

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

function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('データ保存エラー:', e);
        return false;
    }
}

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { newCode, adminCode } = req.body;
    const data = loadData();
    
    // 管理者認証
    if (adminCode !== data.adminCode) {
        return res.status(200).json({ success: false, error: '管理者コードが間違っています' });
    }
    
    if (!newCode || newCode.length < 4) {
        return res.status(200).json({ success: false, error: 'コードは4文字以上である必要があります' });
    }
    
    // 既存のコードチェック
    if (newCode === data.accessCode) {
        return res.status(200).json({ success: false, error: 'このコードは既に存在しています' });
    }
    
    data.accessCode = newCode;
    
    if (saveData(data)) {
        res.status(200).json({ success: true, message: 'アクセスコードを更新しました' });
    } else {
        res.status(200).json({ success: false, error: '保存に失敗しました' });
    }
}
