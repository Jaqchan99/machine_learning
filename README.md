# StockSim - 股票模拟盘

一个基于真实市场数据的股票模拟交易手机端小游戏，内置 AI 智能复盘功能，专为投资新手打造。

![StockSim](https://img.shields.io/badge/StockSim-v1.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## 功能特性

- **实时行情** - 基于 Yahoo Finance 真实美股数据，涵盖 20+ 热门股票
- **模拟交易** - 10万美元虚拟资金，体验真实买入卖出操作
- **持仓管理** - 实时计算浮动盈亏，清晰展示持仓明细
- **AI 复盘** - 每次交易后自动生成 AI 分析报告（支持 OpenAI GPT-4o-mini）
- **K线图表** - 支持 1周/1月/3月/6月/1年 多周期价格走势
- **行业分类** - 按科技、电商、汽车、半导体等板块筛选股票
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

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

启动后端服务器：

```bash
npm run server
```

启动前端开发服务器（另一个终端）：

```bash
npm run dev
```

### 生产部署

```bash
npm start
```

这会先构建前端，然后启动 Express 服务器，访问 `http://localhost:3000`。

## AI 复盘配置

AI 复盘功能支持两种模式：

1. **内置分析**（默认）- 无需配置，提供基础的交易分析和建议
2. **OpenAI GPT** - 配置 API Key 后使用 GPT-4o-mini 提供更深入的分析

### 配置方式

**方式一：环境变量**

创建 `.env` 文件：

```
OPENAI_API_KEY=sk-your-api-key-here
```

**方式二：应用内设置**

在「我的」页面 → AI 复盘设置中直接输入 API Key。

## 项目结构

```
├── index.html              # 入口 HTML
├── vite.config.js          # Vite 配置
├── server/                 # 后端
│   ├── index.js            # Express 服务器
│   ├── store.js            # 内存数据存储
│   └── routes/
│       ├── stock.js        # 股票数据 API
│       ├── portfolio.js    # 投资组合 API
│       └── ai.js           # AI 复盘 API
└── src/                    # 前端
    ├── main.jsx            # React 入口
    ├── App.jsx             # 主应用
    ├── index.css           # 全局样式
    ├── hooks/
    │   └── useApi.js       # API 调用 Hook
    ├── utils/
    │   └── format.js       # 格式化工具函数
    └── components/
        ├── MarketView.jsx      # 行情页面
        ├── TradeView.jsx       # 交易页面
        ├── PortfolioView.jsx   # 持仓页面
        ├── ProfileView.jsx     # 个人设置页面
        ├── StockDetail.jsx     # 股票详情页面
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
