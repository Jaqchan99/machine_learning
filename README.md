# StockSim - 股票模拟盘

一个基于真实市场数据的股票模拟交易手机端小游戏，内置 AI 智能复盘功能，专为投资新手打造。

![StockSim](https://img.shields.io/badge/StockSim-v1.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![PWA](https://img.shields.io/badge/PWA-ready-brightgreen)

## 功能特性

- **实时行情** - 基于 Yahoo Finance 真实美股数据，涵盖 20+ 热门股票
- **模拟交易** - 10 万美元虚拟资金，体验真实买入卖出操作
- **持仓管理** - 实时计算浮动盈亏，清晰展示持仓明细
- **AI 复盘** - 每次交易后自动生成 AI 分析报告（支持 OpenAI GPT-4o-mini）
- **K 线图表** - 支持 1 周/1 月/3 月/6 月/1 年多周期价格走势
- **行业分类** - 按科技、电商、汽车、半导体等板块筛选股票
- **PWA 支持** - 可添加到手机桌面，离线可用，体验接近原生 App
- **移动优先** - 专为手机端设计的深色主题 UI

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + Vite + TailwindCSS v4 |
| 图表 | Recharts |
| 图标 | Lucide React |
| 后端 | Express.js |
| 数据 | Yahoo Finance API (yahoo-finance2) |
| AI | OpenAI GPT-4o-mini (可选) |
| 部署 | Docker / Render / Railway / Fly.io |

---

## 从开发到手机上运行：完整流程

### 整体思路

```
电脑开发 → 部署到云服务器 → 手机浏览器访问网址 → 添加到手机桌面（像App一样使用）
```

本项目是一个 **PWA（渐进式 Web 应用）**，它本质是一个网页，但可以：
- 添加到手机桌面，有独立图标
- 全屏运行，没有浏览器地址栏，看起来就像原生 App
- 支持离线缓存

---

### 第 1 步：在电脑上开发和测试

#### 安装依赖

```bash
npm install
```

#### 开发模式（推荐）

开两个终端窗口：

```bash
# 终端 1：启动后端 API 服务器（端口 3000）
npm run server

# 终端 2：启动前端热更新开发服务器（端口 5173）
npm run dev
```

然后在电脑浏览器打开 `http://localhost:5173`，按 F12 → 切换为手机模拟视图来调试。

#### 生产模式（本地预览）

```bash
npm start
# 访问 http://localhost:3000
```

#### 局域网内手机预览（开发阶段）

如果电脑和手机连了同一个 WiFi，可以直接用手机访问：

1. 在电脑上查看本机 IP：`ifconfig` (Mac/Linux) 或 `ipconfig` (Windows)
2. 假设电脑 IP 是 `192.168.1.100`
3. 手机浏览器打开 `http://192.168.1.100:3000`

> ⚠️ 这只能在同一局域网内使用，离开家就访问不了了。

---

### 第 2 步：部署到云端（让手机随时随地访问）

以下是几种 **免费** 的部署方式，选一个就行：

#### 方式 A：Render.com（推荐新手，最简单）

1. 注册 [render.com](https://render.com)
2. 点击 "New" → "Web Service"
3. 连接你的 GitHub 仓库
4. 设置：
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server/index.js`
5. 点击部署，等待完成
6. 会得到一个类似 `https://stocksim-xxxx.onrender.com` 的网址

#### 方式 B：Railway.app

```bash
# 安装 Railway CLI
npm i -g @railway/cli

# 登录
railway login

# 初始化并部署
railway init
railway up
```

#### 方式 C：Fly.io

```bash
# 安装 flyctl
curl -L https://fly.io/install.sh | sh

# 登录
flyctl auth login

# 部署
flyctl launch
flyctl deploy
```

#### 方式 D：Docker（自有服务器）

```bash
# 构建镜像
docker build -t stocksim .

# 运行
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-xxx stocksim
```

---

### 第 3 步：在手机上"安装"为 App

部署完成后你会得到一个公网网址（如 `https://stocksim.onrender.com`）。

#### iPhone (Safari)

1. 用 **Safari** 打开网址
2. 点击底部 **分享按钮** (方框+箭头图标)
3. 滚动选择 **"添加到主屏幕"**
4. 点击 **"添加"**
5. 桌面上会出现 StockSim 图标，点击打开就是全屏 App 体验

#### Android (Chrome)

1. 用 **Chrome** 打开网址
2. 点击右上角 **三个点 ⋮**
3. 选择 **"添加到主屏幕"** 或 **"安装应用"**
4. 确认安装
5. 桌面上会出现 StockSim 图标

---

### 流程图解

```
┌──────────────────────────────────────────────┐
│                  开发阶段（电脑）                │
│                                              │
│  VS Code / Cursor 编写代码                    │
│       ↓                                      │
│  npm run dev    → 电脑浏览器调试               │
│  npm run server → F12 手机模拟视图             │
│       ↓                                      │
│  同一WiFi下，手机访问电脑IP预览                  │
└──────────────┬───────────────────────────────┘
               │ git push
               ↓
┌──────────────────────────────────────────────┐
│              部署阶段（云端）                    │
│                                              │
│  Render / Railway / Fly.io / Docker          │
│       ↓                                      │
│  获得公网网址: https://stocksim.xxx.com        │
└──────────────┬───────────────────────────────┘
               │ 手机浏览器打开网址
               ↓
┌──────────────────────────────────────────────┐
│              使用阶段（手机）                    │
│                                              │
│  Safari/Chrome → "添加到主屏幕"                │
│       ↓                                      │
│  桌面出现 StockSim 图标                        │
│       ↓                                      │
│  点击打开 = 全屏 App 体验！                     │
└──────────────────────────────────────────────┘
```

---

## AI 复盘配置

AI 复盘功能支持两种模式：

1. **内置分析**（默认）- 无需配置，提供基础的交易分析和建议
2. **OpenAI GPT** - 配置 API Key 后使用 GPT-4o-mini 提供更深入的分析

### 配置方式

**方式一：环境变量**

```bash
# 创建 .env 文件
OPENAI_API_KEY=sk-your-api-key-here
```

**方式二：应用内设置**

在「我的」页面 → AI 复盘设置中直接输入 API Key（保存在浏览器本地）。

---

## 项目结构

```
├── index.html              # 入口 HTML（含 PWA meta 标签）
├── vite.config.js          # Vite 配置
├── Dockerfile              # Docker 部署配置
├── render.yaml             # Render.com 部署配置
├── railway.json            # Railway 部署配置
├── fly.toml                # Fly.io 部署配置
├── public/                 # 静态资源
│   ├── manifest.json       # PWA 清单
│   ├── sw.js               # Service Worker（离线缓存）
│   └── icon.svg            # 应用图标
├── server/                 # 后端
│   ├── index.js            # Express 服务器
│   ├── store.js            # 内存数据存储
│   └── routes/
│       ├── stock.js        # 股票数据 API
│       ├── portfolio.js    # 投资组合 API
│       └── ai.js           # AI 复盘 API
└── src/                    # 前端
    ├── main.jsx            # React 入口
    ├── App.jsx             # 主应用（Tab导航）
    ├── index.css           # 全局样式（TailwindCSS）
    ├── hooks/
    │   └── useApi.js       # API 调用
    ├── utils/
    │   └── format.js       # 格式化工具
    └── components/
        ├── MarketView.jsx      # 行情页面
        ├── TradeView.jsx       # 交易页面
        ├── PortfolioView.jsx   # 持仓页面
        ├── ProfileView.jsx     # 个人设置页面
        ├── StockDetail.jsx     # 股票详情+K线图
        ├── AIReviewPanel.jsx   # AI 复盘弹窗
        └── Toast.jsx           # 提示消息组件
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stock/popular` | 获取热门股票列表 |
| GET | `/api/stock/quote/:symbol` | 获取股票实时报价 |
| GET | `/api/stock/search/:query` | 搜索股票 |
| GET | `/api/stock/history/:symbol` | 获取历史价格 |
| GET | `/api/portfolio` | 获取投资组合 |
| GET | `/api/portfolio/holdings` | 获取持仓详情 |
| POST | `/api/portfolio/buy` | 买入股票 |
| POST | `/api/portfolio/sell` | 卖出股票 |
| POST | `/api/portfolio/reset` | 重置账户 |
| POST | `/api/ai/review` | AI 交易复盘 |
| POST | `/api/ai/market-analysis` | AI 市场分析 |

## 免责声明

本应用为股票模拟交易学习工具，使用真实市场数据但不涉及真实资金。AI 分析建议仅供学习参考，不构成任何投资建议。投资有风险，入市需谨慎。

## License

MIT
