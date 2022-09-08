import * as anchor from "@project-serum/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { AnchorSolanaTwitter } from "../target/types/anchor_solana_twitter";

export const program = anchor.workspace.AnchorSolanaTwitter as anchor.Program<AnchorSolanaTwitter>;
export const provider = anchor.AnchorProvider.env() as anchor.AnchorProvider;
export const user = provider.wallet;

anchor.setProvider(provider);

// { == Helper functions ==> 
export const createUser = async () => {
	const userKeypair = Keypair.generate();
	const userSignature = await provider.connection.requestAirdrop(userKeypair.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
	await provider.connection.confirmTransaction(userSignature);
	return userKeypair
}

export const createUsers = (num: number) => {
	let promises = [];
	for (let i = 0; i < num; i++) promises.push(createUser());
	return Promise.all(promises);
}

// Falling back to `user`: any, as the types of a "regular" keypair wallet and 
// `provider.wallet` - which is used as the default user in the scope of this test - differ.
export const sendTweet = async (user: any, tag: string, content: string) => {
	const tweetKeypair = Keypair.generate();

	await program.methods.sendTweet(tag, content)
		.accounts({
			tweet: tweetKeypair.publicKey,
			user: user.publicKey,
			systemProgram: anchor.web3.SystemProgram.programId,
		})
		.signers(user instanceof (anchor.Wallet) ? [tweetKeypair] : [user, tweetKeypair])
		.rpc();

	// Fetch the created tweet
	const tweet = await program.account.tweet.fetch(tweetKeypair.publicKey);
	return { publicKey: tweetKeypair.publicKey, account: tweet }
};

export const sendComment = async ({ user, tweetParent, content, directParent }: { user: any; tweetParent: PublicKey; content: string; directParent: PublicKey; }) => {
	const commentKeypair = Keypair.generate();

	await program.methods.sendComment(tweetParent, content, directParent)
		.accounts({
			comment: commentKeypair.publicKey,
			user: user.publicKey,
			systemProgram: anchor.web3.SystemProgram.programId,
		})
		.signers(user instanceof (anchor.Wallet as any) ? [commentKeypair] : [user, commentKeypair])
		.rpc();

	const comment = await program.account.comment.fetch(commentKeypair.publicKey);
	return { publicKey: commentKeypair.publicKey, account: comment }
};

export const vote = async (user: any, tweet: PublicKey, result: {}) => {
	const [votingPDA, bump] = await PublicKey.findProgramAddress([
		anchor.utils.bytes.utf8.encode("voting"),
		user.publicKey.toBuffer(),
		tweet.toBuffer(),
	], program.programId);

	await program.methods.vote(tweet, result, bump)
		.accounts({ user: user.publicKey, voting: votingPDA })
		.signers(user instanceof (anchor.Wallet as any) ? [] : [user])
		.rpc();

	const voting = await program.account.voting.fetch(votingPDA);
	return { pda: votingPDA, account: voting }
}

export const sendDm = async (user: any, recipient: PublicKey, content: string) => {
	const dmKeypair = Keypair.generate();
	await program.methods.sendDm(recipient, content)
		.accounts({
			dm: dmKeypair.publicKey,
			user: user.publicKey,
			systemProgram: anchor.web3.SystemProgram.programId,
		})
		.signers(user instanceof (anchor.Wallet as any) ? [dmKeypair] : [user, dmKeypair])
		.rpc();

	const dm = await program.account.dm.fetch(dmKeypair.publicKey);
	return { publicKey: dmKeypair.publicKey, account: dm }
};

// <== }
