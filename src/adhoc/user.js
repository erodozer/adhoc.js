import * as r from 'restructure'
import ipInt from 'ip-to-int'
import {
  IP_ADDR, MAC_ADDR, PRODUCT_CODE, NICKNAME, SceNetAdhocctlPacketBase
} from './packets.js'
import * as db from '../database.js'
import * as channels from '../channels.js'

export const OP_LOGIN = 1
export const OP_DISCONNECT = 3

export const S2C_DISCONNECT = new r.Struct({
  ...SceNetAdhocctlPacketBase,
  ip: IP_ADDR
})

export function handleDisconnect (session) {
  return async () => {
    const {
      user: userId
    } = session

    if (!userId) {
      return
    }

    logout(userId)
  }
}

async function logout (userId) {
  const { room_id: roomId, ip } = await db.logoutUser(userId)
  channels.removeUser(userId)
  if (roomId) {
    channels.leaveRoom(userId, roomId)
    channels.notifyRoom(roomId, userId, [
      S2C_DISCONNECT.toBuffer({
        opcode: OP_DISCONNECT,
        ip
      })
    ])
  }

  console.log(`PSP Disconnected: ${userId}`)
}

export default [
  {
    opcode: OP_LOGIN,
    auth: false,
    schema: new r.Struct({
      ...SceNetAdhocctlPacketBase,
      mac: MAC_ADDR,
      nickname: NICKNAME,
      game: PRODUCT_CODE
    }),
    async handler (msg, session, socket) {
      console.log(`LOGIN NICK ${msg.nickname.trim()}, MAC ${msg.mac}, IP ${socket.remoteAddress}, GAME ${msg.game}`)

      const [user] = await db.addUser({
        nickname: msg.nickname.trim(),
        ip: ipInt(socket.remoteAddress).toInt(),
        mac: msg.mac,
        game: msg.game
      }, session.channel)

      if (!user) {
        console.error('could not write user to database')
        return
      }

      channels.addUser(user.id, socket)

      // add user into list of who is playing a game
      session.user = user.id
    }
  },
  {
    opcode: OP_DISCONNECT,
    auth: false,
    schema: new r.Struct({
      ...SceNetAdhocctlPacketBase
    }),
    async handler (msg, session, socket) {
      const {
        user: userId
      } = session

      const [user] = await db.getUser([userId])

      console.log(`LOGOUT NICK ${user.nickname}, MAC ${user.mac}`)

      logout(userId)

      // add user into list of who is playing a game
      session.user = null
    }
  }
]
