import { createServer } from 'net'
import express from 'express'
import AdhocRouter from './src/adhoc/index.js'
import HttpRouter from './src/http.js'
import { handleDisconnect } from './src/adhoc/user.js'

function startAdhoc () {
  const ADHOC_PORT = 27312

  const server = createServer()

  server.on('connection', (socket) => {
    const id = socket.remoteAddress
    console.log(`PSP Connected: ${id}`)

    const session = {
      user: null
    }

    // route PSP packets
    socket.on('data', AdhocRouter(session, socket))

    // clear out user data
    socket.on('close', handleDisconnect(session))
  })

  server.listen(ADHOC_PORT, '0.0.0.0', () => {
    console.log(`adhoc service started: ${server.address().port}`)
  })
}

function startHttp () {
  const app = express()

  app.use(HttpRouter)

  const port = process.env.EXPRESS_PORT || 8081

  app.listen(port, () => {
    console.log(`http service started on ${port}`)
  })
}

startAdhoc()
startHttp()
