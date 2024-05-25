import { decodeSuiPrivateKey, Signer } from '@mysten/sui.js/cryptography';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromHEX } from '@mysten/sui.js/utils';
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { readFile } from "fs"
import axios from 'axios';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleMergeClick() {
    async function claim(){
        console.log(i)
        const phrase = 'masukin phrase disini'
        const keypair = Ed25519Keypair.deriveKeypair(phrase);
        const address = keypair.toSuiAddress()
        console.log(address)
        const selectedCoin = '0xa8816d3a6e3136e86bc2873b1f94a15cadc8af2703c075f2d546c2ae367f4df9::ocean::OCEAN'
        const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io"})
        const tx = new TransactionBlock();
        const coinObjectIds = [];
        let cursor = null;

        console.log('Start getting data...');
        do {
        const objectListResponse = await client.getCoins({
            owner: address,
            coinType: selectedCoin,
            cursor: cursor,
            limit: 100
        });

        const objectList = objectListResponse.data;
        coinObjectIds.push(...objectList.map(item => item.coinObjectId));

        if (objectListResponse.hasNextPage) { cursor = objectListResponse.nextCursor; } else { cursor = null; }
        if (coinObjectIds.length >= 500) { cursor = null; }
        } while (cursor);
        console.log('Data collection done');

        if ((selectedCoin != '0x2::sui::SUI' && coinObjectIds.length >= 2) || (selectedCoin == '0x2::sui::SUI' && coinObjectIds.length >= 3)) {
        if (selectedCoin == '0x2::sui::SUI') { coinObjectIds.shift(); }

        const firstObjectId = coinObjectIds.shift();
        const remainingObjectIds = coinObjectIds.map(id => tx.object(id));

        if (firstObjectId != null && remainingObjectIds.length > 0) {
            tx.mergeCoins(tx.object(firstObjectId), remainingObjectIds);
            try {
            const result = await client.signAndExecuteTransactionBlock({
                signer: keypair,
                transactionBlock: tx,
            });

            if (!result.errors || result.errors.length === 0) {
                console.log(`Finish merging objects, digest: ${result.digest}`);
            }
            else {
                const errorMessages = result.errors.join(', ');
                console.log(`${errorMessages}`);
                console.log(`Error when merging objects, ${errorMessages}`);
            }
            } catch (e) {
            console.log(`${e}`);
            console.log(`Error when merging objects, ${e}`);
            }

        } else { console.log('Errors: Data has changed, please try again'); }
        }
        else { console.log('Errors: Data has changed, please try again'); }
        }
        claim()
    }


handleMergeClick()