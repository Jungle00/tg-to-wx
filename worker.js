export default {
    async fetch(request, env) {
        if (request.method !== "POST") return new Response("OK");

        try {
            const payload = await request.json();
            const msg = payload.message || payload.channel_post;
            if (!msg) return new Response("No message");

            const BOT_TOKEN = "Your Telegram Bot Token";//Telegram机器人token
            const WEBHOOK_URL = "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=Your Enterprise WeChat Group Key";//企微群聊webhook地址

            let fileId = null;
            let typeLabel = "";

            // 1. 识别资源 ID
            if (msg.photo) {
                fileId = msg.photo[msg.photo.length - 1].file_id;
                typeLabel = "照片";
            } else if (msg.sticker) {
                fileId = msg.sticker.file_id;
                typeLabel = "贴纸";
            }

            if (fileId) {
                // 获取文件路径
                const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`).then(r => r.json());
                if (!fileRes.ok) throw new Error("TG 无法获取文件路径");

                // 下载文件
                const imgBuffer = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${fileRes.result.file_path}`).then(r => r.arrayBuffer());

                // 计算 MD5 和 Base64
                const hashBuffer = await crypto.subtle.digest("MD5", imgBuffer);
                const md5 = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
                const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));

                // 发送给企微
                const qwRes = await fetch(WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        "msgtype": "image",
                        "image": { "base64": base64, "md5": md5 }
                    })
                }).then(r => r.json());

                // 如果企微返回错误（例如不支持 WebP 贴纸），则转发为文字提醒
                if (qwRes.errcode !== 0) {
                    await fetch(WEBHOOK_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            "msgtype": "text",
                            "text": { "content": `⚠️ 企微拒收该${typeLabel}\n错误原因: ${qwRes.errmsg}\n请直接在 TG 查看。` }
                        })
                    });
                }
                return new Response("OK");
            }

            // 处理普通文字
            if (msg.text) {
                await fetch(WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ "msgtype": "text", "text": { "content": msg.text } })
                });
            }

            return new Response("OK");
        } catch (e) {
            return new Response("Error: " + e.message);
        }
    }
};