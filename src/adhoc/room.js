import * as r from 'restructure'
import {
  IP_ADDR, MAC_ADDR, NICKNAME, ROOMNAME, OpHead, SceNetAdhocctlPacketBase
} from './packets.js'
import * as db from '../database.js'
import * as channels from '../channels.js'

export const OP_JOINROOM = 2
export const OP_SCAN = 4
export const OP_SCAN_COMPLETE = 5
export const OP_CONNECT_BBSIC = 6

const S2C_JOINROOM = new r.Struct({
  ...SceNetAdhocctlPacketBase,
  nickname: NICKNAME,
  mac: MAC_ADDR,
  ip: IP_ADDR
})

const S2C_SCAN = new r.Struct({
  ...SceNetAdhocctlPacketBase,
  room: ROOMNAME,
  mac: MAC_ADDR
})

const S2C_CONNECT_BBSIC = new r.Struct({
  ...SceNetAdhocctlPacketBase,
  mac: MAC_ADDR
})

export default [
  // connects a user into a game room
  {
    opcode: OP_JOINROOM,
    auth: true,
    schema: new r.Struct({
      ...SceNetAdhocctlPacketBase,
      room: ROOMNAME
    }),
    async handler (msg, session) {
      const {
        user: userId
      } = session

      const [user] = await db.getUser([userId])

      console.log(`JOIN NICK ${user.nickname}, GAME ${user.game}, ROOM ${msg.room}`)

      const { id: roomId } = await db.addToRoom({ userId, game: user.game, name: msg.room })

      channels.createRoom(roomId)
      channels.addToRoom(userId, roomId)

      channels.notifyRoom(roomId, userId, [S2C_JOINROOM.toBuffer({
        opcode: OP_JOINROOM,
        nickname: user.nickname,
        mac: user.mac,
        ip: user.ip
      })])

      const { users, founder } = await db.getUsersInRoom(roomId)
      const [{ mac }] = await db.getUser([founder])
      const others = users.filter((r) => r.user_id !== userId).flatMap((r) => db.getUser([r.user_id]))
      channels.notifyUser(userId, others.map(
        (user) => S2C_JOINROOM.toBuffer({
          opcode: OP_JOINROOM,
          nickname: user.nickname,
          mac: user.mac,
          ip: user.ip
        })
      ))

      // send BSSID to User
      channels.notifyUser(userId, [S2C_CONNECT_BBSIC.toBuffer({
        opcode: OP_CONNECT_BBSIC,
        mac
      })])
    }
  },
  // scans for a room
  {
    opcode: OP_SCAN,
    auth: true,
    schema: new r.Struct({
      ...SceNetAdhocctlPacketBase
    }),
    async handler (msg, session) {
      const {
        user: userId
      } = session

      const [user] = await db.getUser([userId])

      console.log(`SCAN NICK ${user.nickname}, GAME ${user.game}`)

      const rooms = await db.getRooms([user.game])
      for (const room of rooms) {
        const { founder, users } = await db.getUsersInRoom(room.id)
        if (users.length === 0) {
          continue
        }
        const [{ mac }] = await db.getUser([founder])

        // notify player of rooms for game
        channels.notifyUser(userId, [
          S2C_SCAN.toBuffer({
            opcode: OP_SCAN,
            room: room.name,
            mac
          })
        ])
      }

      // notify player that scan is over
      channels.notifyUser(userId, [
        OpHead.toBuffer({
          opcode: OP_SCAN_COMPLETE
        })
      ])
    }
  }
]
