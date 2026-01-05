The project can forwards message to designated Chinese groups , when you send message to your own Telegram Bot that has a configured webhook URL.

# Telegram机器人接收到的消息转发到企微群中  



## Cloudflare白嫖免费版本
可以利用Cloudflare的Worker，将Worker的访问地址设定为Tg机器人的webhook地址，Worker接收到请求后解析并请求企微消息群机器人，但是免费版的worker有运行时间限制，遇到稍微大一点的图片，解析下载图片的时候可能会超时，但是重点是每日有100000 次的免费请求



## 腾讯云函数
通过转发消息给Telegram中自定义的机器人触发请求至腾讯云SCF函数服务，云函数解析来自Telegram的请求，再请求到企微群机器人的webhook地址，从而实现了Telegram的消息转发至企微消息群的效果，云函数尽量选择香港区域的，否则无法访问到Tg服务器进而无法下载Tg图片

