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
    const data = loadData();
    
    if (req.method === 'GET') {
        res.status(200).json({ messages: data.messages });
    } else if (req.method === 'POST') {
        const { name, content } = req.body;
        
        if (!name || !content) {
            return res.status(200).json({ success: false, error: '名前とメッセージは必須です' });
        }
        
        const newMessage = {
            id: Date.now(),
            name,
            content,
            timestamp: new Date().toLocaleString('ja-JP')
        };
        
        data.messages.unshift(newMessage);
        
        if (saveData(data)) {
            res.status(200).json({ success: true, message: newMessage });
        } else {
            res.status(200).json({ success: false, error: '保存に失敗しました' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
