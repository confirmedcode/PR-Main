const auth = require('basic-auth')

const admin = { name: 'preview', password: 'preview1' }

module.exports = function(request, response, next) {
  var user = auth(request)
  if (!user || !admin.name || admin.password !== user.pass) {
    response.set('WWW-Authenticate', 'Basic realm="Access before public release."')
    return response.status(401).send()
  }
  return next()
}