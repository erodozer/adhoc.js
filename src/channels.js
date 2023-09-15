import { v3 as uuidns } from 'uuid'
import { Subject } from 'rxjs'
import { filter, share } from 'rxjs/operators'

// in-memory socket maps
const users = {}
const rooms = {}
const userRoom = {}

export function addUser (userId, socket) {
  const channel = new Subject()
    .subscribe({
      next: (msg) => {
        console.log(`SEND USER: ${userId}, MSG: ${msg}`)
        socket.write(msg)
      }
    })

  Object.assign(users, { [userId]: channel })
}

export function removeUser (userId) {
  delete users[userId]
}

export function createRoom (roomId) {
  const {
    [roomId]: channel = new Subject().pipe(share({ resetOnRefCountZero: true }))
  } = rooms

  Object.assign(rooms, { [roomId]: channel })
}

export function addToRoom (userId, roomId) {
  const {
    [roomId]: room
  } = rooms

  const userRoomChId = uuidns(userId, roomId)

  const subscription = room.pipe(filter(({ fromUser }) => fromUser !== userId))
    .subscribe({
      next: ({ msg }) => users[userId].next(msg)
    })

  Object.assign(userRoom, { [userRoomChId]: subscription })
}

export function leaveRoom (userId, roomId) {
  const userRoomChId = uuidns(userId, roomId)

  const {
    [userRoomChId]: channel
  } = userRoom

  channel?.unsubscribe()

  // clear inactive rooms
  const {
    [roomId]: roomCh
  } = rooms

  if (!roomCh?.observed) {
    delete rooms[roomId]
  }
}

export function notifyUser (userId, messages) {
  const {
    [userId]: channel
  } = users

  for (const msg of messages) {
    channel?.next(msg)
  }
}

export function notifyRoom (roomId, fromUser, messages) {
  const {
    [roomId]: channel
  } = rooms

  for (const msg of messages) {
    channel?.next({ fromUser, msg })
  }
}
