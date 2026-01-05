const axios = require('axios');
const crypto = require('crypto');

// --- 配置区 ---
const BOT_TOKEN = "Your Telegram Bot Token";//Telegram机器人token
const WECHAT_WEBHOOK = "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=Your Enterprise WeChat Group Key";//企微群聊webhook地址

exports.main_handler = async (event, context) => {
    try {
        const body = JSON.parse(event.body);
        const msg = body.message || body.channel_post;
        if (!msg) return { statusCode: 200, body: "no msg" };

        // 1. 处理文字消息
        const text = msg.text || msg.caption;
        if (text) {
            await axios.post(WECHAT_WEBHOOK, {
                msgtype: "text",
                text: { content: text }
            });
        }

        // 2. 处理图片/贴纸
        let fileId = null;
        if (msg.photo) {
            fileId = msg.photo[msg.photo.length - 1].file_id;
        } else if (msg.sticker) {
            fileId = msg.sticker.file_id;
        }

        if (fileId) {
            // 获取文件路径
            const fileInfo = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
            const filePath = fileInfo.data.result.file_path;

            // 下载文件
            const response = await axios.get(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`, {
                responseType: 'arraybuffer'
            });
            const buffer = Buffer.from(response.data);

            // 计算 MD5 和 Base64
            const md5 = crypto.createHash('md5').update(buffer).digest('hex');
            const base64 = buffer.toString('base64');

            // 发送给企微
            await axios.post(WECHAT_WEBHOOK, {
                msgtype: "image",
                image: { base64: base64, md5: md5 }
            });
        }

        return { statusCode: 200, body: "ok" };
    } catch (err) {
        console.error(err);
        return { statusCode: 200, body: err.message };
    }
};