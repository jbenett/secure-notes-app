# InfoSecurity Project: Encrypted Notes App
#### Team Insecurities

Our encrpyted notes app is a desktop application which encrypts a user's notes.

## Running the App

#### From root directory, run
```bash
cd app/app
```
#### Install dependencies
```bash
npm install
```
##### Run the app
```bash
npm start
```

##### To set up the backend, open a new terminal window and navigate back to the project directory and do
```bash
cd backend
```

##### install dependencies
```bash
npm install
```

##### run
```bash
npm start
```

## Components

#### 2FA

Write something about 2FA here....

#### Encryption

1. Compiling the verysecure module
    + Setup build environment (Debian)
        * ```sudo apt install build-essential npm nodejs```
        * ```sudo npm install -g node-gyp```
    + Install node-gyp:
        * ```npm install -g node-gyp```
    + Change directory:
        * ```cd /path/to/CSE4471/encryption```
    + Build module:
        * ```node-gyp configure; node-gyp build```
    + Relocate module:
        * File is ```./build/Release/verysecure.node```
2. Using the verysecure module:
```javascript
const crypto = require('./verysecure');

function encrypt(data, key){
  var txt = Buffer.from(data,'ascii');
  return crypto.encrypt(txt, key).toString('hex');
}

function decrypt(data, key){
  var ctxt = Buffer.from(data,'hex');
  return crypto.decrypt(ctxt, key).toString('ascii');
}
```

#### Validation

Write something about validation here....

