import { Router } from 'express'
import * as db from './database.js'

const router = Router()

router.get('/game', async (req, res) => {
  const games = await db.getGames()

  res.json({
    games
  })
})

router.get('/game/:sku', async (req, res) => {
  const {
    params: {
      sku
    }
  } = req

  res.json({
    sku,
    rooms: await db.getRooms([sku])
  })
})

router.get('/room/:id', async (req, res) => {
  const {
    params: {
      id
    }
  } = req

  const room = await db.getRoom(id)
  const { founder, users } = await db.getUsersInRoom(id)

  res.json({
    id,
    name: room.name,
    founder: founder.user_id,
    users
  })
})

router.get('/all', async (req, res) => {
  const games = await db.getGames()

  res.json({
    games: games.map(
      (game) => ({
        ...game,
        rooms: db.getRooms([game.sku]).map(
          (room) => {
            const { users, founder } = db.getUsersInRoom(room.id)

            return {
              ...room,
              founder,
              users
            }
          }
        )
      })
    )
  })
})

export default router
