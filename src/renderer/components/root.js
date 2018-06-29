import React from 'react'
import { connect, Provider } from 'react-redux'
import PropTypes from 'prop-types'
import routes from '@root/routes'
import store from '@root/store'
import Router from './router'

const Root = () => (
  <Provider store={store}>
    <Router routes={routes} defaultRoute={'/'} />
  </Provider>
)

Root.propTypes = {
  //store: PropTypes.object.isRequired,
  //page: PropTypes.func,
}

export default Root