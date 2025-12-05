# 日志文件目录

此目录存储应用程序的所有日志文件。

## 日志文件格式

- `app-YYYY-MM-DD.log` - 主日志文件
- `app-YYYY-MM-DD-N.log` - 当文件超过 1GB 时的分割文件

## 日志轮转规则

- 每个日志文件最大 1GB
- 按日期自动分割
- 超过大小限制自动创建新文件

## 日志内容

- 入站请求：`--> METHOD PATH`
- 出站响应：`<-- METHOD PATH STATUS TIME`
