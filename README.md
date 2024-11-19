# POC Merkle Patricia Trie transaction receipt inclusion proof

## Rebuild receipt tree with EthereumJS client

src: https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/

path = rlp(transactionIndex)

Type Receipt = concatenation of TransactionType and ReceiptPayload

Type LegacyReceipt = rlp([status, cumulativeGasUsed, logsBloom, logs])

codigo fuente:
https://github.com/ethereumjs/ethereumjs-monorepo/blob/d2f10abf767c30570a3ecf12812c039d18c46dda/packages/vm/src/buildBlock.ts#L167

https://github.com/ethereumjs/ethereumjs-monorepo/blob/d2f10abf767c30570a3ecf12812c039d18c46dda/packages/vm/src/runBlock.ts#L767

tutorial: https://github.com/gabrocheleau/merkle-patricia-trees-examples

## Notas

- To verify a specific type of data, you must refer to the appropriate root hash:

  - If you want to verify an account balance or nonce, use the state root.
  - If you want to verify a transaction’s inclusion, use the transactions root.
  - If you want to verify a transaction’s receipt, use the receipts root.

- The Returned receipt can be of type Receipt which is defined as the concatenation of TransactionType and ReceiptPayload or it can be of type LegacyReceipt which is defined as rlp([status, cumulativeGasUsed, logsBloom, logs]).

## Run mpt.js

Generate receiptTrie, obtain root and proof, verify proof

```bash
node --env-file=.env .\test.js
```

## Run mpt_transactions.ts

Generate transactionTrie, uses Transaction.serialization()

```bash
npx ts-node .\mpt_transactions.ts
```
