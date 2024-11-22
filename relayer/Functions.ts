import { MerklePatriciaTrie } from '@ethereumjs/mpt'
import { RLP } from '@ethereumjs/rlp'
import { LegacyTransaction, FeeMarketEIP1559Transaction, AccessListEIP2930Transaction } from "@ethereumjs/tx";
import { Common } from "@ethereumjs/common";

// Define a generic transaction type
type EthereumTransaction = FeeMarketEIP1559Transaction | AccessListEIP2930Transaction | LegacyTransaction;

// Function to create a transaction from Infura data
function createTransactionFromInfura(data: any): EthereumTransaction {
  const common = new Common({ chain: 'mainnet' });

  // Determine the transaction type
  if (data.type === '0x2') {
    // EIP-1559 transaction
    return FeeMarketEIP1559Transaction.fromTxData(
      {
        chainId: data.chainId,
        nonce: data.nonce,
        maxPriorityFeePerGas: data.maxPriorityFeePerGas,
        maxFeePerGas: data.maxFeePerGas,
        gasLimit: data.gas,
        to: data.to,
        value: data.value,
        data: data.input,
        accessList: data.accessList,
        v: data.v,
        r: data.r,
        s: data.s,
      },
      { common }
    );
  } else if (data.type === '0x1') {
    // EIP-2930 transaction with access lists
    return AccessListEIP2930Transaction.fromTxData(
      {
        chainId: data.chainId,
        nonce: data.nonce,
        gasPrice: data.gasPrice,
        gasLimit: data.gas,
        to: data.to,
        value: data.value,
        data: data.input,
        accessList: data.accessList,
        v: data.v,
        r: data.r,
        s: data.s,
      },
      { common }
    );
  } else {
    // Legacy transaction
    return LegacyTransaction.fromTxData(
      {
        nonce: data.nonce,
        gasPrice: data.gasPrice,
        gasLimit: data.gas,
        to: data.to,
        value: data.value,
        data: data.input,
        v: data.v,
        r: data.r,
        s: data.s,
      },
      { common }
    );
  }
}


export async function genTransactionsTrieRoot(
  txs: any[]
) {
  const trie = new MerklePatriciaTrie()
  for (const [i, tx] of txs.entries()) {
    const tx2 = createTransactionFromInfura(tx)
    await trie.put(RLP.encode(i), tx2.serialize())
  }
  return trie.root()
}
