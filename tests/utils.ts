import * as anchor from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import { provider } from "../tests";

export const createUser = async () => {
	const userKeypair = Keypair.generate();
	const userSignature = await provider.connection.requestAirdrop(
		userKeypair.publicKey,
		10 * anchor.web3.LAMPORTS_PER_SOL
	);
	await provider.connection.confirmTransaction(userSignature);
	return userKeypair;
};

export const createUsers = (num: number) => {
	let promises = [];
	for (let i = 0; i < num; i++) promises.push(createUser());
	return Promise.all(promises);
};
