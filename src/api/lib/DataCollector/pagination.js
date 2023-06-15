import config from '../../../lib/config'
const { MAX_LIMIT, MAX_PAGES } = config.api
const SEPARATOR = '__'

export async function countDocuments (query, repository) {
  query = query || {}
  try {
    let result = await repository.countDocuments(query)
    return result
  } catch (err) {
    return Promise.reject(err)
  }
}

export function generateCursorQuery ({ cursorField, sortDir, value, sortField }) {
  if (!value) return
  const op = (sortDir === -1) ? '$lt' : '$gt'
  if (sortField && (sortField !== cursorField)) {
    return {
      $or: [{
        [sortField]: {
          [op]: value[1]
        }
      }, {
        [sortField]: {
          $eq: value[1]
        },
        [cursorField]: {
          [op]: value[1]
        }
      }]
    }
  }
  return { [cursorField]: { [op]: value[0] } }
}

export function formatSearchValue (value, type) {
  if (value !== null && value !== undefined) {
    if (type === 'number') value = parseInt(value)
  }
  return value
}

export function generateSort ({ cursorField, sortField, sortDir }) {
  if (sortField && (sortField !== cursorField)) {
    return {
      [sortField]: sortDir,
      [cursorField]: sortDir
    }
  }
  return { [cursorField]: sortDir }
}

export function generateQuery (params, query = {}) {
  let cursorQuery = generateCursorQuery(params)
  if (!cursorQuery || Object.keys(cursorQuery) < 1) return query
  return (query && Object.keys(query).length > 0) ? { $and: [cursorQuery, query] } : cursorQuery
}

export function parseParams (cursorData, params) {
  params = Object.assign({}, params)
  params.sort = params.sort || {}
  const { cursorField, fields } = cursorData
  let { sortDir, prev, next, sort, count, countOnly, limit, getPages, page, prevPage } = params

  count = count || countOnly
  limit = limit || 50
  limit = parseInt(limit)
  page = parseInt(page)
  page = (page > 0) ? page : 1

  let indexedPages = Math.floor(MAX_LIMIT / limit)
  if (MAX_PAGES && indexedPages > MAX_PAGES) indexedPages = MAX_PAGES
  const indexedSegment = Math.floor((page - 1) / indexedPages)

  let queryLimit = (getPages) ? indexedPages * limit : limit

  // supports only one sort field
  let sortField = Object.keys(sort)[0]
  sortField = (sortField !== cursorField) ? sortField : null

  sortDir = (sortField) ? sort[sortField] : sort[cursorField]
  sortDir = (sortDir === 1) ? 1 : -1
  let backwardNav = !!prev || !!prevPage
  if (backwardNav) {
    sortDir = (sortDir === 1) ? -1 : 1
  }

  const valueEncoded = (backwardNav) ? prev : next
  let value

  const types = [fields[cursorField], fields[sortField]]
  if (undefined !== valueEncoded) {
    value = valueEncoded.toString().split(SEPARATOR).map((v, i) => formatSearchValue(v, types[i]))
  }

  params = Object.assign(params, {
    sortField,
    sortDir,
    backwardNav,
    value,
    valueEncoded,
    limit,
    cursorField,
    cursorData,
    count,
    queryLimit,
    getPages,
    page,
    indexedPages,
    indexedSegment
  })
  return params
}

export async function findPages (cursorData, query, params, repository) {
  try {
    params = parseParams(cursorData, params)
    const { fields, count, countOnly, queryLimit } = params
    const $query = generateQuery(params, query)
    const $sort = generateSort(params)
    let data = (!countOnly) ? await find($query, $sort, queryLimit + 1, fields, repository) : null
    let total = (count) ? (await countDocuments(query, repository)) : null
    return paginationResponse(params, data, total)
  } catch (err) {
    return Promise.reject(err)
  }
}

export async function aggregatePages (cursorData, query, params, repository) {
  try {
    params = parseParams(cursorData, params)
    const { fields, count, countOnly, queryLimit } = params
    let match = generateQuery(params)
    const sort = generateSort(params)
    const aggregate = modifyAggregate(query, { match, sort, limit: queryLimit + 1, fields })
    let data = (!countOnly) ? await repository.aggregate(aggregate) : null
    let total = (count) ? await getAggregateTotal(query, repository) : null
    return paginationResponse(params, data, total)
  } catch (err) {
    return Promise.reject(err)
  }
}

export function modifyAggregate (query, { match, sort, limit, fields }) {
  let aggregate = [...query]
  let index = aggregate.findIndex(v => v.$match)
  index = (index > -1) ? index : aggregate.unshift(null)

  let mm = (aggregate[index]) ? aggregate[index].$match : null
  let $match = (mm) ? { $and: [match, mm] } : match
  aggregate[index] = { $match }
  index++

  if (sort) {
    aggregate.splice(index, 0, { $sort: sort })
    index++
  }

  if (limit) aggregate.splice(index, 0, { $limit: limit })
  return aggregate
}

export async function getAggregateTotal ([query], repository) {
  const total = await countDocuments(query, repository)

  return total || null
}

export function paginationResponse (params, data, total) {
  total = total || null
  const { indexedPages, limit, getPages, indexedSegment, page, valueEncoded, queryLimit } = params
  const pages = []

  let next = null
  let prev = null
  let nextPage = null
  let prevPage = null

  if (data) {
    const hasMore = data.length > queryLimit
    const hasPrevious = !!params.next || !!(params.prev && hasMore)

    let totalPages = data.length / limit
    totalPages = (hasMore) ? Math.floor(totalPages) : Math.ceil(totalPages)

    if (hasMore) data.pop()
    if (params.prev) data.reverse()

    prev = (hasPrevious) ? generateCursor(params, data[0]) : null
    next = (!!params.prev || hasMore) ? generateCursor(params, data[data.length - 1]) : null

    if (getPages) {
      let pageNumber
      for (let i = 0; i < totalPages; i++) {
        pageNumber = (indexedSegment * indexedPages) + i
        let pageData = { page: (pageNumber + 1) }
        if (params.next) pageData.next = valueEncoded
        else if (params.prev) pageData.prev = valueEncoded
        pages.push(pageData)
      }

      let skip = (parseInt((page - 1).toString().split('').pop())) * limit
      if (next) {
        nextPage = { next, page: pageNumber + 2 }
        pages.push(nextPage)
      }
      if (prev) {
        prevPage = { prev, page: pages[0].page - 1 }
      }
      data = data.splice(skip, limit)
    }
  }

  const pagination = { limit, total, next, prev, page, pages, nextPage, prevPage }
  return { pagination, data }
}

export async function find (query, sort, limit, project, repository) {
  sort = sort || {}
  project = project || {}
  limit = limit || 0
  let data = await repository
    .find(query, project, sort, limit)
    .catch((err) => {
      return Promise.reject(err)
    })
  return data
}

export function encodeValue (value) {
  return value.join(SEPARATOR)
}

export function generateCursor ({ cursorField, sortField }, data) {
  if (sortField) {
    return encodeValue([data[cursorField], data[sortField]])
  }
  return data[cursorField]
}
