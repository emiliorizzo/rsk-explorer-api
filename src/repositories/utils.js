function mongoSortToPrisma (num) {
  if (num === 1) {
    return 'asc'
  } else {
    return 'desc'
  }
}

function createPrismaOrderBy (sortOrProject) {
  const sort = sortOrProject.sort || sortOrProject

  let orderBy = []
  if (sort) {
    orderBy = Object.entries(sort).map(([param, value]) => {
      const prismaValue = mongoSortToPrisma(value)
      if (param.charAt() === '_') {
        param = param.substring(1)
      }
      const prismaSort = {
        [param]: prismaValue
      }
      return prismaSort
    })
  }
  return orderBy
}

function createPrismaSelect (project) {
  let select = {}
  if (project.projection) {
    const listOfSelects = Object.keys(project.projection)
    for (const key of listOfSelects) {
      if (project.projection[key] === 1) {
        select[key] = true
      }
    }
  }
  return (Object.keys(select).length !== 0) ? select : null
}

// TODO: finish the mapping of the remaining mongo operators
function mongoQueryToPrisma (query) {
  const mongoOperatorToPrisma = {
    $or: 'OR',
    $and: 'AND',
    $lt: 'lt',
    $gt: 'gt',
    $eq: 'equals',
    $in: 'in',
    $ne: 'not',
  }

  for (const key in query) {
    const value = query[key]

    if (Array.isArray(value)) {
      return {[mongoOperatorToPrisma[key] || key]: value.map(elem => ['Array', 'Object'].includes(elem.constructor.name) ? mongoQueryToPrisma(elem) : elem)}
    } else if (!(typeof value === 'string') && Object.keys(value).length > 0) {
      return {[mongoOperatorToPrisma[key] || key]: mongoQueryToPrisma(value)}
    } else {
      if (key === '$exists') {
        return value ? {not: null} : {equals: null}
      } else if (key.includes('.')) {
        return formatRelationQuery({[key]: value})
      } else {
        return {[mongoOperatorToPrisma[key] || key]: value}
      }
    }
  }

  return {}
}

function formatExistsQuery (query) {
  const [key] = Object.keys(query)

  return {
    [key]: {not: null}
  }
}

function removeNullFields (obj, nullableFields = []) {
  if (typeof obj === 'string') {
    return obj
  } else {
    return Object.entries(obj).reduce((filtered, [key, value]) => {
      if (value !== undefined) {
        if (value !== null) {
          if (value.constructor.name === 'Array') {
            filtered[key] = value.map(v => removeNullFields(v))
          } else if (value.constructor.name === 'Object') {
            filtered[key] = removeNullFields(value)
          } else {
            filtered[key] = value
          }
        }
      } else if (nullableFields.includes(key)) {
        filtered[key] = null
      }

      return filtered
    }, {})
  }
}

export {mongoSortToPrisma, createPrismaOrderBy, createPrismaSelect, mongoQueryToPrisma, removeNullFields}
