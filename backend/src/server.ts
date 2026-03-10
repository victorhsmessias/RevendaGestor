import 'dotenv/config'
import { buildApp } from './app'

async function bootstrap() {
  const app = await buildApp({ logger: true })

  const port = parseInt(process.env.PORT || '3001')
  const host = '0.0.0.0'

  try {
    await app.listen({ port, host })
    app.log.info(`RevendaGestor API rodando em http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

bootstrap()
