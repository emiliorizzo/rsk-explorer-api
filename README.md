# Rsk explorer api

## Description

## Components

### Api server


### Blocks service
  Imports blockchain data from rsk node to db.

### User events service
  (Optional)
 Allows to update fields on the fly and send async response to clients.

## Requisites

- mongodb > 4
- node > 8

## Install

- Install dependecies

``` shell
    npm install
  ```

## Configuration file 
(optional)

``` shell
    cp config-example.json config.json
  ```

see [configuration](#configuration)

## Start

### services

``` shell
  node dist/services/blocks
```

### api

``` shell
  node dist/api
```

## Commands

Run api in development mode

``` shell
    npm run dev
  ```

Run blocks service in development mode

``` shell
    npm run blocks
  ```

Production build to ./dist folder

``` shell
    npm run build
  ```

## Configuration
  
  **config.json**
  See defaults on: **lib/defaultConfig**
  *(config.json overrides this values)*

  Use:
  
  ```shell
  node dist/tools/showConfig.js 
  ```

  to check current configuration
  
**Configurarion Example:**

``` javascript
   "source": {
    "node": "localhost",
    "port": 4444
  },
  "api": {
    "address": "localhost",
    "port": 3003
  },
  "db": {
    "server": "localhost",
    "port": 27017,
    "database": "blockDB"
  }

  ```

### Source

  **node**: "localhost",
  **port**: 4444

### db

  **server**": "localhost"
  **port**": 27017
  **database**: "explorerDB"

**Optionals:**

  **user**: < user >
  **password**: < password >

### blocks
  
  **validateCollections** :[Boolean] Validate collectios at blocks service start
  **blocksQueueSize**:[Number]
  **bcTipSize**:[Number] BC tip size

### api
  **address** [string] api server bind address
  **port**  [number] api server port

  **allowUserEvents** [Boolean]: enable/disable userEventsApi

