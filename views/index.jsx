const React = require('react')
const DefaultLayout = require('./layouts/default')

class HelloReact extends React.Component {
  render () {
    return (
      <DefaultLayout>
        <div className='container'>
          <h1 className='text-center'>Hello React!</h1>
        </div>
      </DefaultLayout>
    )
  }
}

module.exports = HelloReact
