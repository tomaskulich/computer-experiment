const _ = require('lodash')

const get_number_node = (number) => ({
  type: 'number',
  calculate: () => number,
})

const get_vector_node = (array, primitive_type) => {
  // vectors can be either array of nodes, or array of primite values such as numbers. In the latter
  // case, `type` is the type of the primitive value and needs to be defined. This is a performance
  // optimization that surely is premature for such a quick demo :)
  for (let elem of array) {
    if (elem.type == null && primitive_type == null) {
      return {type: error, node: 'get_vector_node'}
    }
  }
  return {type: 'vector', primitive_type, length: array.length, calculate: () => array}
}

const plus_node = (a, b) => {
  if (a.type === 'number' && b.type === 'number') {
    return {type: 'number', calculate: () => a.calculate() + b.calculate()}
  } else if (a.type === 'vector') {
    // no matter what we're dealing with, this needs to hold
    if (!(a.primitive_type === b.primitive_type && a.length === b.length)) {
      return {type: 'error', node: 'plus_node', args: [a, b]}
    }
    if (a.primitive_type != null) {
      // vectors of primitive values, let's just _.sum the stuff, ignoring the subtype for now
      return {...a, calculate: () => _.map(_.zip(a.calculate(), b.calculate()), _.sum)}
    } else {
      // vectors of nodes
      // compile-time we check, whether the vectors can be plus-ed point-wise
      const result = _.map(_.zip(a.calculate(), b.calculate()), ([ai, bi]) => {
        return check_types([plus_node, ai, bi])
      })
      return {...a, calculate: () => {
        const error = _.find(result, (x) => (x.type === 'error'))
        if (error) {
          return error
        } else {
          return _.map(result, (x) => x.calculate())
        }
      }}
    }
  } else {
    return {type: 'error', node: 'plus_node', args: [a, b]}
  }
}

const execute_computation = (computation) => {
  return check_types(computation).calculate()
}

const check_types = (computation) => {
  const [main_node, ...args] = computation
  return main_node(...args)
}

let computation = [plus_node, get_number_node(1), get_number_node(2)]

console.log(check_types(computation))
console.log(execute_computation(computation))

const vector_1 = get_vector_node([1], 'number')
const vector_12 = get_vector_node([1, 2], 'number')
const vector_123 = get_vector_node([1,2,3], 'number')
const vector_456 = get_vector_node([4,5,6], 'number')

computation = [plus_node, vector_123, vector_456]
console.log(check_types(computation))
console.log(execute_computation(computation))

const _2d_vector_type = {type: 'vector', subtype: {type: 'vector', subtype: {type: 'number'}, length: 3}, length: 3}

const vector_2d_a = get_vector_node([vector_1, vector_12, vector_123])
const vector_2d_b = get_vector_node([vector_1, vector_12, vector_456])

computation = [plus_node, vector_2d_a, vector_2d_b]
console.log(check_types(computation))
console.log(execute_computation(computation))
