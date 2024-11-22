# Cross-chain communication protocol : Off chain elements

In this project we develop a cross blockchain communication protocol.
In this repo off chain elements are implemented.

# Relayer

Relayers are the off chains agents that are in charge of listening to communication contract
events and forwarding messages to the destintation blockchain.

It is also responsible of generating the inclusion proof and forwarding it along with the message.

They are designed to function in a marketplace manner, with each message having an associated fee
that is used to pay blockchain gas and the remainder is kept as an incentive by the relayer that
fowards the message after reception confirmation.

The relayer can ask the gas estimation in the destintation blockchain from a dedicated server to decide if the fee asociated to a message results in a desirable incentive.

Additionaly, it waits for finality before forwarding the messages. In the context of this implementation, finality is defined in a per message manner as a number of blocks that are
waited after the source block of the message. It's under the user responsability to
define the number of blocks in accordance to source blockchain's finality considerations.

## Features

- Listens to communication contract events
- Verify inclusion of message in blockchain
- Generate message inclusion proof for communication contract
- Request fee estimation from server
- Ask for incentive after message is received by destination blockchain
- Wait for finality for each message

### Events that are listened

- New blocks emited
- Message emitted
- Message recieved
- Fees for message are updated

## Run examples

### mpt.js

Generate receiptTrie, obtain root and proof, verify proof

```bash
node --env-file=.env .\mpt.js
```

### mpt_transactions.ts

Generate transactionTrie, uses Transaction.serialization()

```bash
npx ts-node .\mpt_transactions.ts
```

### relayer_server.js

Initializes a relayer that listen to events, new blocks and past events on start up.
for a number of chains

```bash
node --env-file=.env .\relayer_server.js
```

## Development Notes

## TODO

- Handle rpc provider change upon loss of service from current provider
- Add actual information for communication contracts in supported blockchains
- Implement consensus among multiple relayers

## License

This project is licensed under the MIT License. See the LICENSE file for details.

# Server API (TODO)

## Overview

The server is in charge of fee estimation for each blockchain.

It makes available and API to request fees both from relayers and front ends.

# Front end (TODO)

## Overview

Provides an interface for user to start an session of the proof-of-concept game implemented
and to play subsequent rounds.

It also provides an interface to see message and game status.
