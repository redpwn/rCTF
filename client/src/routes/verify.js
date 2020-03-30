import Error from './error'
import config from '../../../config/client'
import 'linkstate/polyfill'

import TokenPreview from '../components/tokenPreview'
import { verify } from '../api/auth'
import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'

function Verify () {
  const [error, setError] = useState()
  const [token, setToken] = useState()

  useEffect(() => {
    document.title = `Verify${config.ctfTitle}`

    const prefix = '#token='
    if (document.location.hash.startsWith(prefix)) {
      const verifyToken = decodeURIComponent(document.location.hash.substring(prefix.length))

      setToken(verifyToken)
    }

    document.location.hash = ''
  }, [])

  const submitToken = () => {
    verify({ verifyToken: token })
      .then((errors) => {
        setError(errors.verifyToken)
      })
  }

  const cancel = () => route('/login')

  if (error) {
    return <Error error='401' message={error} />
  }
  return (
    <div class='row u-text-center u-center'>
      <div class='col-4'>
        <div class="card">
          <div class="card-head">
            <p class="card-head-title">Your Token</p>
          </div>
          <div class="content">
            <TokenPreview token={token} />
          </div>
          <div class="action-bar u-center">
            <button class="btn" onClick={cancel}>Cancel</button>
            <button class="btn" onClick={submitToken}>Login</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Verify
