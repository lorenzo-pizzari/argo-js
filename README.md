[![js-standard-style](https://cdn.rawgit.com/standard/standard/master/badge.svg)](http://standardjs.com)

# Argo.js

A Node.js Identity Provider / Single SignOn Service powered by [Hapi.js](https://github.com/hapijs)

## Dependency

- `node-gyp`
- Python 2.xx
- `OpenSSL`

## Install and Run the project

To run properly the project you need to run a node version that supports the async/await functions check 
[here](http://node.green/#ES2017-features-async-functions) if your version is supported.

```bash
npm install --production
npm start
```

After the startup the Server URL is written on the console output (http://localhost:8000)