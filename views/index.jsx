const React = require('react')
const DefaultLayout = require('./layouts/default')

class HelloReact extends React.Component {
  render () {
    return (
      <DefaultLayout>
        <h1>Hello React!</h1>
      </DefaultLayout>
    )
  }
}

module.exports = HelloReact
