import { useState, useEffect, useMemo, useCallback, useRef } from 'preact/hooks'
import config from '../../../config/client'
import withStyles from '../components/jss'
import Pagination from '../components/pagination'

import { getScoreboard } from '../api/scoreboard'
import { privateProfile } from '../api/profile'

const PAGESIZE_OPTIONS = [25, 50, 100]

const Scoreboard = withStyles({
  frame: {
    paddingBottom: '1.5em',
    paddingTop: '2.125em'
  },
  tableFrame: {
    paddingTop: '1.5em'
  },
  selected: {
    backgroundColor: 'hsla(0, 100%, 95%, 0.8)',
    '&:hover': {
      backgroundColor: 'hsla(0, 80%, 92%, 0.8) !important'
    }
  }
}, ({ classes }) => {
  const loggedIn = useMemo(() => localStorage.getItem('token') !== null, [])
  const [profile, setProfile] = useState(null)
  const [pageSize, _setPageSize] = useState(100)
  const [scores, setScores] = useState([])
  const [division, _setDivision] = useState('all')
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const selfRow = useRef()

  const setDivision = useCallback((newDivision) => {
    _setDivision(newDivision)
    setPage(1)
  }, [_setDivision, setPage])
  const setPageSize = useCallback((newPageSize) => {
    _setPageSize(newPageSize)
    // Try to switch to the page containing the teams that were previously
    // at the top of the current page
    setPage(Math.floor((page - 1) * pageSize / newPageSize) + 1)
  }, [pageSize, _setPageSize, page, setPage])

  const divisionChangeHandler = useCallback((e) => setDivision(e.target.value), [setDivision])
  const pageSizeChangeHandler = useCallback((e) => setPageSize(e.target.value), [setPageSize])

  useEffect(() => { document.title = `Scoreboard${config.ctfTitle}` }, [])
  useEffect(() => {
    if (loggedIn) {
      privateProfile()
        .then(p => setProfile(p))
    }
  }, [loggedIn])
  useEffect(() => {
    const _division = division === 'all' ? undefined : division
    getScoreboard({
      division: _division,
      offset: (page - 1) * pageSize,
      limit: pageSize
    })
      .then(data => {
        setScores(data.leaderboard.map((entry, i) => ({
          ...entry,
          rank: i + 1 + (page - 1) * pageSize
        })))
        setTotalItems(data.total)
      })
  }, [division, page, pageSize])

  const isUserOnCurrentScoreboard = loggedIn && (division === 'all' || Number.parseInt(division) === profile.division)
  const isSelfVisible = useMemo(() => {
    if (profile == null) return false
    let isSelfVisible = false
    // TODO: maybe avoiding iterating over scores again?
    scores.forEach(({ id }) => {
      if (id === profile.id) {
        isSelfVisible = true
      }
    })
    return isSelfVisible
  }, [profile, scores])
  const scrollToSelf = useCallback(() => {
    selfRow.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selfRow])
  const [needsScrollToSelf, setNeedsScrollToSelf] = useState(false)
  const goToSelfPage = useCallback(() => {
    if (!isUserOnCurrentScoreboard) return
    let place
    if (division === 'all') {
      place = profile.globalPlace
    } else {
      place = profile.divisionPlace
    }
    setPage(Math.floor((place - 1) / pageSize) + 1)

    if (isSelfVisible) {
      scrollToSelf()
    } else {
      setNeedsScrollToSelf(true)
    }
  }, [profile, setPage, pageSize, division, isUserOnCurrentScoreboard, isSelfVisible, scrollToSelf])
  useEffect(() => {
    if (needsScrollToSelf) {
      if (isSelfVisible) {
        scrollToSelf()
        setNeedsScrollToSelf(false)
      }
    }
  }, [isSelfVisible, needsScrollToSelf, scrollToSelf])

  return (
    <div class='row u-center' style='align-items: initial !important'>
      <div class='col-3'>
        <div class={`frame ${classes.frame}`}>
          <div class='frame__body'>
            <div class='frame__subtitle'>Filter by division</div>
            <div class='input-control'>
              <select required class='select' name='division' value={division} onChange={divisionChangeHandler}>
                <option value='all' selected>All</option>
                {
                  Object.entries(config.divisions).map(([name, code]) => {
                    return <option key={code} value={code}>{name}</option>
                  })
                }
              </select>
            </div>
            <div class='frame__subtitle'>Teams per page</div>
            <div class='input-control'>
              <select required class='select' name='pagesize' value={pageSize} onChange={pageSizeChangeHandler}>
                { PAGESIZE_OPTIONS.map(sz => <option value={sz}>{sz}</option>) }
              </select>
            </div>
            { loggedIn &&
              <div class='btn-container u-center'>
                <button disabled={!isUserOnCurrentScoreboard} onClick={goToSelfPage}>
                  Go to my team
                </button>
              </div>
            }
          </div>
        </div>
      </div>
      <div class='col-6'>
        <div class={`frame ${classes.frame} ${classes.tableFrame}`}>
          <div class='frame__body'>
            <table class='table small'>
              <thead>
                <tr>
                  <th style='width: 0.625em'>#</th>
                  <th>Team</th>
                  <th style='width: 3.125em'>Points</th>
                </tr>
              </thead>
              <tbody>
                { scores.map(({ id, name, score, rank }) => {
                  const isSelf = profile != null && profile.id === id

                  return (
                    <tr key={id}
                      class={isSelf ? classes.selected : ''}
                      ref={isSelf ? selfRow : null}
                    >
                      <td>{rank}</td>
                      <td>
                        <a href={`/profile/${id}`}>{name}</a>
                      </td>
                      <td>{score}</td>
                    </tr>
                  )
                }) }
              </tbody>
            </table>
          </div>
          { totalItems > pageSize &&
            <Pagination
              {...{ totalItems, pageSize, page, setPage }}
              numVisiblePages={9}
            />
          }
        </div>
      </div>
    </div>
  )
})

export default Scoreboard
