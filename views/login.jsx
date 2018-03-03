const React = require('react')
const DefaultLayout = require('./layouts/default')

class Login extends React.Component {
  render () {
    let statusMessage
    if (this.props.status === 'Unauthorized') {
      statusMessage = <div className='alert alert-danger' role='alert'>
        Wrong Credentials!
      </div>
    }
    return (
      <DefaultLayout pageStyle='login.css' title='Login'>
        <div>
          <div className='container'>
            <h1 className='welcome text-center'>Argo.js</h1>
            <div className='card card-container'>
              <h2 className='login_title text-center'>Login</h2>
              <hr />
              <form className='form-signin' method='POST' action={this.props.location}>
                <span id='reauth-email' className='reauth-email' />
                <p className='input_title'>Email</p>
                <input id='inputEmail' className='login_box' placeholder='user01@email.com' required autoFocus type='text' name='email' />
                <p className='input_title'>Password</p>
                <input id='inputPassword' className='login_box' placeholder='******' required type='password' name='password' />
                {statusMessage}
                {/* <input id='remember' type='checkbox' name='rembemberMe' value='true' /> Remember Me */}
                <button className='btn btn-lg btn-primary' type='submit'>Login</button>
              </form>{/* /form */}
            </div>{/* /card-container */}
          </div>{/* /container */}
        </div>
      </DefaultLayout>
    )
  }
}

module.exports = Login
