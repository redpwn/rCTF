import { v4 as uuidv4 } from 'uuid'
import emailValidator from 'email-validator'
import * as cache from '../../cache'
import * as util from '../../util'
import * as auth from '../../auth'
import config from '../../config/server'
import { responses } from '../../responses'
import { getUserByNameOrEmail } from '../../database/users'
import { sendVerification } from '../../email'

export default {
  method: 'POST',
  path: '/auth/register',
  requireAuth: false,
  schema: {
    body: {
      type: 'object',
      properties: {
        email: {
          type: 'string'
        },
        name: {
          type: 'string'
        },
        ctftimeToken: {
          type: 'string'
        }
      },
      required: ['name'],
      oneOf: [{
        required: ['email']
      }, {
        required: ['ctftimeToken']
      }]
    }
  },
  handler: async ({ req }) => {
    let email
    let ctftimeId
    if (req.body.ctftimeToken !== undefined) {
      const ctftimeData = await auth.token.getData(auth.token.tokenKinds.ctftimeAuth, req.body.ctftimeToken)
      if (ctftimeData === null) {
        return responses.badCtftimeToken
      }
      ctftimeId = ctftimeData.ctftimeId
    } else {
      email = util.normalize.normalizeEmail(req.body.email)
      if (!emailValidator.validate(email)) {
        return responses.badEmail
      }
    }

    const name = util.normalize.normalizeName(req.body.name)
    if (!util.validate.validateName(name)) {
      return responses.badName
    }

    if (!config.email) {
      const division = config.defaultDivision || Object.keys(config.divisions)[0]
      return auth.register.register({
        division,
        email,
        name,
        ctftimeId
      })
    }

    const division = config.divisionACLs
      ? util.restrict.allowedDivisions(email)[0]
      : (config.defaultDivision || Object.keys(config.divisions)[0])
    if (division === undefined) {
      return responses.badCompetitionNotAllowed
    }

    if (req.body.ctftimeToken !== undefined) {
      return auth.register.register({
        division,
        name,
        ctftimeId
      })
    }

    const conflictRes = await getUserByNameOrEmail({ name, email })
    if (conflictRes) {
      if (conflictRes.email === email) {
        return responses.badKnownEmail
      }
      return responses.badKnownName
    }

    const verifyUuid = uuidv4()
    await cache.login.makeLogin({ id: verifyUuid })
    const verifyToken = await auth.token.getToken(auth.token.tokenKinds.verify, {
      verifyId: verifyUuid,
      kind: 'register',
      email,
      name,
      division
    })

    await sendVerification({
      email,
      kind: 'register',
      token: verifyToken
    })

    return responses.goodVerifySent
  }
}
