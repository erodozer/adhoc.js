import userRoutes from './user.js'
import commonOps, { OP_PING } from './ops.js'
import roomRoutes from './room.js'
import { OpHead } from './packets.js'

function registerRoutes (router, routes) {
  routes.forEach(
    (r) => {
      Object.assign(router, { [r.opcode]: r })
    }
  )
}

export default function (session, socket) {
  const router = {}

  registerRoutes(router, commonOps)
  registerRoutes(router, userRoutes)
  registerRoutes(router, roomRoutes)

  return async (buffer) => {
    const { opcode = null } = OpHead.fromBuffer(buffer) || {}

    if (opcode == null) {
      console.error('Could not parse opcode from message')
      return
    }

    if (opcode !== OP_PING) {
      console.log(`RECEIVE OP ${opcode}, MSG ${new Uint8Array(buffer.buffer)}`)
    }

    const {
      [opcode]: {
        auth = false,
        schema,
        handler
      } = {}
    } = router

    if (!handler) {
      console.error(`OPCODE not recognized, op: ${opcode}`)
      return
    }

    if (auth && !session.user) {
      console.error(`user is not yet set on connection, op: ${opcode}`)
      return
    }

    try {
      const parsed = schema.fromBuffer(buffer)
      await handler(parsed, session, socket)
    } catch (e) {
      console.error('unable to handle message', e)
    }
  }
}
