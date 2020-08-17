import { v4 as uuidv4 } from 'uuid'
import emailValidator from 'email-validator'
import * as cache from '../../cache'
import * as util from '../../util'
import * as auth from '../../auth'
import * as database from '../../database'
import config from '../../config/server'
import { responses } from '../../responses'
import { sendVerification } from '../../email'

export default {
  method: 'POST',
  path: '/auth/recover',
  requireAuth: false,
  schema: {
    body: {
      type: 'object',
      properties: {
        email: {
          type: 'string'
        }
      },
      required: ['email']
    }
  },
  handler: async ({ req }) => {
    if (!config.email) {
      return responses.badEndpoint
    }

    const email = util.normalize.normalizeEmail(req.body.email)
    if (!emailValidator.validate(email)) {
      return responses.badEmail
    }

    const user = await database.users.getUserByEmail({ email })
    if (user === undefined) {
      return responses.badUnknownEmail
    }

    const verifyUuid = uuidv4()
    await cache.login.makeLogin({ id: verifyUuid })
    const verifyToken = await auth.token.getToken(auth.token.tokenKinds.verify, {
      verifyId: verifyUuid,
      kind: 'recover',
      userId: user.id,
      email
    })

    await sendVerification({
      email,
      kind: 'recover',
      token: verifyToken
    })

    return responses.goodVerifySent
  }
}
