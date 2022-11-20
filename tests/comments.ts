import * as assert from "assert";
import * as anchor from "@project-serum/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { program, user } from "../tests";
import { sendTweet } from "../tests/tweets";

const sendComment = async ({
	user,
	tweetParent,
	content,
	directParent,
}: {
	user: any;
	tweetParent: PublicKey;
	content: string;
	directParent: PublicKey;
}) => {
	const commentKeypair = Keypair.generate();

	await program.methods
		.sendComment(tweetParent, content, directParent)
		.accounts({
			comment: commentKeypair.publicKey,
			user: user.publicKey,
			systemProgram: anchor.web3.SystemProgram.programId,
		})
		.signers(
			user instanceof (anchor.Wallet as any)
				? [commentKeypair]
				: [user, commentKeypair]
		)
		.rpc();

	const comment = await program.account.comment.fetch(commentKeypair.publicKey);
	return { publicKey: commentKeypair.publicKey, account: comment };
};

export default () => {
	it("can comment and update comments", async () => {
		const tweet = await sendTweet(user, "comment", "on me!");

		// Send comment
		const tweetComment = await sendComment({
			user: user,
			tweetParent: tweet.publicKey,
			content: "🍗",
			directParent: null,
		});
		assert.equal(
			tweetComment.account.tweet.toBase58(),
			tweet.publicKey.toBase58()
		);

		// Update comment
		await program.methods
			.updateComment("🍠")
			.accounts({
				comment: tweetComment.publicKey,
				user: user.publicKey,
			})
			.rpc();
		const updatedTweetComment = await program.account.comment.fetch(
			tweetComment.publicKey
		);
		assert.equal(updatedTweetComment.content, "🍠");
		assert.deepEqual(updatedTweetComment.state, { edited: {} });

		// Comment on a comment
		const commentComment = await sendComment({
			user: user,
			tweetParent: tweet.publicKey,
			content: "😍",
			directParent: tweetComment.publicKey,
		});
		assert.equal(
			commentComment.account.tweet.toBase58(),
			tweet.publicKey.toBase58()
		);
		assert.equal(
			commentComment.account.parent.toBase58(),
			tweetComment.publicKey.toBase58()
		);
	});

	it("can delete comments", async () => {
		const tweet = await sendTweet(user, "comment", "on me!");

		// Send comment
		const tweetComment = await sendComment({
			user: user,
			tweetParent: tweet.publicKey,
			content: "whoops",
			directParent: null,
		});
		assert.equal(
			tweetComment.account.tweet.toBase58(),
			tweet.publicKey.toBase58()
		);

		// Delete comment
		await program.methods
			.deleteComment()
			.accounts({
				comment: tweetComment.publicKey,
				user: user.publicKey,
			})
			.rpc();

		const deletedComment = await program.account.comment.fetch(
			tweetComment.publicKey
		);
		assert.equal(deletedComment.content, "");
		assert.deepEqual(deletedComment.state, { deleted: {} });
	});
};
