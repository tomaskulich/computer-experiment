/*
node is a typed, lazily-materialized value.
  .type
  .calculate() materializes the calculation
  ...attributes to specify the type

computation is of a form:
  [get_node, ...nodes],
where get_node(...nodes) produces the resulting node, i.e. does the type-check.
*/

const _ = require('lodash')

const get_number_node = (number) => ({
  type: 'number',
  calculate: () => number,
})

const get_vector_node = (array) => {
  return {type: 'vector', length: array.length, calculate: () => array}
}

const plus_node = (a, b) => {
  if (a.type === 'number' && b.type === 'number') {
    return {type: 'number', calculate: () => a.calculate() + b.calculate()}
  } else if (a.type === 'vector' && b.type === 'vector') {
    if (a.length !== b.length) {
      return {type: 'error', node: 'plus_node', args: [a, b]}
    }
    const result = _.map(_.zip(a.calculate(), b.calculate()), ([ai, bi]) => {
      return plus_node(ai, bi)
    })
    return {...a, calculate: () => {
      const error = _.find(result, (x) => (x.type === 'error'))
      if (error) {
        return error
      } else {
        return _.map(result, (x) => x.calculate())
      }
    }}
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

const one = get_number_node(1)
const two = get_number_node(2)
const three = get_number_node(3)
const four = get_number_node(4)
const five = get_number_node(5)
const six = get_number_node(6)

let computation = [plus_node, one, two]

console.log(check_types(computation))
console.log(execute_computation(computation))

// primitive vectors demo
const vector_1 = get_vector_node([one])
const vector_12 = get_vector_node([one, two])
const vector_123 = get_vector_node([one, two, three])
const vector_456 = get_vector_node([four, five, six])

computation = [plus_node, vector_123, vector_456]
console.log(check_types(computation))
console.log(execute_computation(computation))

// heterogeneous vectors demo
const vector_2d_a = get_vector_node([vector_1, vector_12, vector_123])
const vector_2d_b = get_vector_node([vector_1, vector_12, vector_456])

computation = [plus_node, vector_2d_a, vector_2d_b]
console.log(check_types(computation))
console.log(execute_computation(computation))
