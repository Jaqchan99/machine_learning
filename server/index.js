import express from 'express'
import cors from 'cors'
import compression from 'compression'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'
import stockRoutes from './routes/stock.js'
import aiRoutes from './routes/ai.js'
import portfolioRoutes from './routes/portfolio.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(compression())
app.use(express.json())

app.use('/api/stock', stockRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/portfolio', portfolioRoutes)

const distPath = join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🚀 股票模拟盘服务器运行在 http://localhost:${PORT}`)
})
